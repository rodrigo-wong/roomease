<?php

namespace App\Http\Controllers;

use Stripe\Stripe;
use App\Models\Room;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Customer;
use Stripe\PaymentIntent;
use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use App\Models\OrderBookable;
use App\Models\ContractorRole;
use Illuminate\Support\Carbon;
use App\Mail\OrderConfirmation;
use App\Enums\OrderBookableStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Mail\ContractorConfirmation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use Stripe\Checkout\Session as StripeSession;

class CheckoutController extends Controller
{
    public function checkout(Request $request)
    {
        DB::beginTransaction();

        try {
            // Validate the request data.
            $validated = $request->validate([
                'first_name'   => 'required|string|max:255',
                'last_name'    => 'required|string|max:255',
                'email'        => 'required|email',
                'phone_number' => 'required|string',
                'room_id'      => 'required|exists:bookables,id',
                'date'         => 'required|date',
                'timeslots'    => 'required|array',
                'addons'       => 'nullable|array',
                'total_amount' => 'required|numeric',
                'hours'        => 'required|integer|min:2',
                'order'        => 'nullable|integer'
            ]);

            // If an order ID is provided, delete the existing order.
            if (isset($validated['order']) && $validated['order']) {
                Log::info('Order found: ' . $validated['order']);
                $orderToDelete = Order::find($validated['order']);
                if ($orderToDelete) {
                    $orderToDelete->delete();
                }
            }

            // Parse start and end times using Carbon.
            $startTime = Carbon::parse($validated['date'] . ' ' . $validated['timeslots'][0]);
            $endTime   = Carbon::parse($validated['date'] . ' ' . $validated['timeslots'][1]);

            // ---------------------
            // Conflict Check: Room
            // ---------------------
            $room = Room::where('bookable_id', $validated['room_id'])->firstOrFail();

            $roomConflict = OrderBookable::where('bookable_id', $room->id)
                ->where('bookable_type', Room::class)
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->whereBetween('start_time', [$startTime, $endTime])
                        ->orWhereBetween('end_time', [$startTime, $endTime])
                        ->orWhere(function ($query) use ($startTime, $endTime) {
                            $query->where('start_time', '<=', $startTime)
                                ->where('end_time', '>=', $endTime);
                        });
                })->exists();

            if ($roomConflict) {
                throw new \Exception("The selected room is already booked for the chosen time slot.");
            }

            // ----------------------
            // Conflict Check: Addons
            // ----------------------
            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addon) {
                    if ($addon['bookable_type'] === 'product') {
                        $product = Product::where('bookable_id', $addon['id'])->firstOrFail();
                        $addonConflict = OrderBookable::where('bookable_id', $product->id)
                            ->where('bookable_type', Product::class)
                            ->where(function ($query) use ($startTime, $endTime) {
                                $query->whereBetween('start_time', [$startTime, $endTime])
                                    ->orWhereBetween('end_time', [$startTime, $endTime])
                                    ->orWhere(function ($query) use ($startTime, $endTime) {
                                        $query->where('start_time', '<=', $startTime)
                                            ->where('end_time', '>=', $endTime);
                                    });
                            })->exists();

                        if ($addonConflict) {
                            throw new \Exception("The product addon with ID {$addon['id']} is already booked for the chosen time slot.");
                        }
                    } elseif ($addon['bookable_type'] === 'contractor') {
                        // Get the count of overlapping contractor bookings.
                        $existingBookingCount = OrderBookable::where('bookable_id', $addon['role'])
                            ->where('bookable_type', ContractorRole::class)
                            ->where(function ($query) use ($startTime, $endTime) {
                                $query->whereBetween('start_time', [$startTime, $endTime])
                                    ->orWhereBetween('end_time', [$startTime, $endTime])
                                    ->orWhere(function ($query) use ($startTime, $endTime) {
                                        $query->where('start_time', '<=', $startTime)
                                            ->where('end_time', '>=', $endTime);
                                    });
                            })->count();

                        // Determine the requested quantity (default to 1 if not specified).
                        $requestedQuantity = isset($addon['quantity']) ? $addon['quantity'] : 1;

                        // Retrieve the contractor role record to check available quantity.
                        $contractorRole = ContractorRole::findOrFail($addon['role']);
                        $availableQuantity = $contractorRole->quantity;

                        // If adding the requested quantity exceeds available quantity, throw an exception.
                        if ($existingBookingCount + $requestedQuantity > $availableQuantity) {
                            throw new \Exception("The contractor addon with role ID {$addon['role']} does not have enough available quantity for the chosen time slot.");
                        }
                    }
                }
            }

            // ---------------------
            // Proceed with Booking
            // ---------------------
            // Find or create the customer.
            $customer = Customer::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'first_name'   => $validated['first_name'],
                    'last_name'    => $validated['last_name'],
                    'phone_number' => $validated['phone_number']
                ]
            );

            // Create the order (with a processing status).
            $order = Order::create([
                'customer_id'  => $customer->id,
                'total_amount' => $validated['total_amount'],
                'status'       => OrderStatus::PROCESSING,
                'hours'        => $validated['hours'],
                'start_time'   => $startTime,
            ]);

            // Create the room booking.
            OrderBookable::create([
                'order_id'      => $order->id,
                'bookable_id'   => $room->id,
                'bookable_type' => Room::class,
                'quantity'      => 1,
                'status'        => OrderBookableStatus::CONFIRMED,
                'start_time'    => $startTime,
                'end_time'      => $endTime,
            ]);

            // Process add-on bookings, if provided.
            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addon) {
                    $orderData = [
                        'order_id'      => $order->id,
                        'bookable_id'   => $addon['bookable_type'] === 'product'
                            ? Product::where('bookable_id', $addon['id'])->first()->id
                            : $addon['role'],
                        'bookable_type' => $addon['bookable_type'] === 'product'
                            ? Product::class
                            : ContractorRole::class,
                        'quantity'      => 1,
                        'status'        => $addon['bookable_type'] === 'product'
                            ? OrderBookableStatus::CONFIRMED
                            : OrderBookableStatus::PENDING,
                        'start_time'    => $startTime,
                        'end_time'      => $endTime,
                    ];

                    $quantity = isset($addon['quantity']) ? $addon['quantity'] : 1;
                    for ($i = 0; $i < $quantity; $i++) {
                        OrderBookable::create($orderData);
                    }
                }
            }

            // Set the Stripe secret key.
            \Stripe\Stripe::setApiKey(env('STRIPE_SECRET'));

            // Create a PaymentIntent with manual capture enabled.
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount'                => $validated['total_amount'] * 100, // amount in cents
                'currency'              => 'usd',
                'payment_method_types'  => ['card'],
                'capture_method'        => 'manual',
                'metadata'              => [
                    'order_id' => $order->id,
                ],
            ]);

            // Create the payment record.
            Payment::create([
                'customer_id'              => $customer->id,
                'order_id'                 => $order->id,
                'stripe_payment_intent_id' => $paymentIntent->id,
                'amount'                   => $validated['total_amount'],
                'currency'                 => 'usd',
                'status'                   => 'pending',
            ]);

            // Commit the transaction.
            DB::commit();

            // Return the client secret so the frontend can complete payment.
            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'order'         => $order->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Checkout failed: " . $e->getMessage());
            return response()->json(['error' => 'Failed to create booking: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Cancel route to clean up if payment fails.
     * This route should be set as the Stripe Checkout cancel_url.
     */
    public function cancel(Request $request)
    {
        Log::info('Payment cancelled: ' . $request->query('order'));
        // Expect the order id as a query parameter (passed in via the cancel URL)
        $orderId = $request->query('order');

        if (!$orderId) {
            return redirect()->route('checkout')->withErrors(['error' => 'No order found to cancel.']);
        }

        // Delete the order and its associated records in a transaction.
        DB::transaction(function () use ($orderId) {
            $order = Order::find($orderId);
            if ($order) {
                // Delete related order bookings (assumes proper relationship and cascade rules)
                $order->orderBookables()->delete();
                // Delete the order
                $order->delete();
            }
        });
        Log::info("Order {$orderId} and related records deleted.");
        return redirect()->route('client.home');
    }

    public function success(Request $request)
    {
        // Retrieve Stripe session id from query
        $sessionId = $request->query('session_id');
        if (!$sessionId) {
            return redirect()->route('checkout')->withErrors(['error' => 'No session id provided.']);
        }

        try {
            Stripe::setApiKey(env('STRIPE_SECRET'));
            $session = StripeSession::retrieve($sessionId);
            $paymentIntentId = $session->payment_intent;

            if (!$paymentIntentId) {
                return redirect()->route('client.home')->withErrors(['error' => 'No payment intent found.']);
            }

            // Retrieve the order from metadata
            $orderId = $session->metadata->order_id ?? null;
            if (!$orderId) {
                // Order ID missing, cancel PaymentIntent
                try {
                    $paymentIntent = PaymentIntent::retrieve($session->payment_intent);
                    $paymentIntent->cancel();

                    Log::info("PaymentIntent {$paymentIntentId} canceled due to missing order_id.");
                } catch (\Exception $e) {
                    Log::error("Error canceling PaymentIntent: " . $e->getMessage());
                }
                return redirect()->route('client.home')->withErrors(['error' => 'Order not found. Payment canceled.']);
            }

            /**
             * @var Order $order
             */
            $order = Order::find($orderId);
            if (!$order) {
                // Order not found, cancel PaymentIntent
                try {
                    $paymentIntent = PaymentIntent::retrieve($session->payment_intent);
                    $paymentIntent->cancel();
                    Log::info("PaymentIntent {$paymentIntentId} canceled because order {$orderId} was not found.");
                } catch (\Exception $e) {
                    Log::error("Error canceling PaymentIntent: " . $e->getMessage());
                }
                return redirect()->route('client.home')->withErrors(['error' => 'Order expired in our records. Payment canceled.']);
            }

            // At this point, the order is valid.
            // Capture the PaymentIntent manually.
            $paymentIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);
            $captured = $paymentIntent->capture();
            if ($captured->status !== 'succeeded') {
                return redirect()->route('checkout')->withErrors(['error' => 'Payment capture failed.']);
            }

            // Update order status accordingly
            $order->status = $order->isCompleted() ? OrderStatus::COMPLETED->value : OrderStatus::PENDING->value;
            $order->save();

            // Now send confirmation emails since payment is successful
            $customer = $order->customer;
            $contractors = json_decode($session->metadata->contractors, true) ?? [];
            Mail::to($customer->email)->send(new OrderConfirmation($order));

            // Group contractor emails by role ID.
            $groupedContractors = [];
            foreach ($contractors as $contractor) {
                $roleId = $contractor['role'];
                $groupedContractors[$roleId][] = $contractor['email'];
            }

            // Retrieve all roles in one query.
            $roles = ContractorRole::whereIn('id', array_keys($groupedContractors))->get()->keyBy('id');

            // Send emails using the grouped data.
            foreach ($groupedContractors as $roleId => $emails) {
                $role = $roles->get($roleId);
                foreach ($emails as $email) {
                    Mail::to($email)->send(new ContractorConfirmation($order, $role, $email));
                }
            }
            $orderDetails = $order->details();
            dd('confirmed');
        } catch (\Exception $e) {
            Log::error("Payment success processing error: " . $e->getMessage());
            return redirect()->route('checkout')->withErrors(['error' => 'An error occurred while processing payment success.']);
        }
    }
}
