<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderBookable;
use App\Models\Product;
use App\Models\ContractorRole;
use App\Enums\OrderStatus;
use App\Enums\OrderBookableStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;
use App\Mail\OrderConfirmation;
use App\Mail\ContractorConfirmation;

class CheckoutController extends Controller
{
    public function checkout(Request $request)
    {
        DB::beginTransaction();

        try {
            // Validate the request data
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
                'hours'        => 'required|integer|min:1'
            ]);

            // Find or create the customer
            $customer = Customer::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'first_name'   => $validated['first_name'],
                    'last_name'    => $validated['last_name'],
                    'phone_number' => $validated['phone_number']
                ]
            );

            // Create the order (pending)
            $order = Order::create([
                'customer_id'  => $customer->id,
                'total_amount' => $validated['total_amount'],
                'status'       => OrderStatus::PROCESSING,
            ]);

            // Create the room booking
            OrderBookable::create([
                'order_id'      => $order->id,
                'bookable_id'   => $validated['room_id'],
                'bookable_type' => Room::class,
                'quantity'      => 1,
                'status'        => OrderBookableStatus::CONFIRMED,
                'start_time'    => $validated['date'] . ' ' . $validated['timeslots'][0],
                'end_time'      => $validated['date'] . ' ' . $validated['timeslots'][1],
            ]);

            $contractorEmails = [];
            // Create addon bookings if provided
            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addon) {
                    $orderData = [
                        'order_id'      => $order->id,
                        'bookable_id'   => $addon['bookable_type'] === 'product' ? $addon['id'] : $addon['role'],
                        'bookable_type' => $addon['bookable_type'] === 'product' ? Product::class : ContractorRole::class,
                        'quantity'      => 1,
                        'status'        => $addon['bookable_type'] === 'product'
                            ? OrderBookableStatus::CONFIRMED
                            : OrderBookableStatus::PENDING,
                        'start_time'    => $validated['date'] . ' ' . $validated['timeslots'][0],
                        'end_time'      => $validated['date'] . ' ' . $validated['timeslots'][1],
                    ];

                    $quantity = isset($addon['quantity']) ? $addon['quantity'] : 1;
                    for ($i = 0; $i < $quantity; $i++) {
                        OrderBookable::create($orderData);
                    }
                    if ($addon['bookable_type'] === 'contractor') {
                        $contractorEmails[] = [
                            'role'   => ContractorRole::find($addon['role']),
                            'emails' => $addon['emails']
                        ];
                    }
                }
            }

            // Set Stripe secret key
            Stripe::setApiKey(env('STRIPE_SECRET'));

            // Build Stripe line items
            $lineItems = [];
            $room = Room::where('bookable_id', $validated['room_id'])->with('bookable')->first();
            if (!$room) {
                throw new \Exception("Room not found.");
            }
            $roomData = $room->toArray();

            $lineItems[] = [
                'price_data' => [
                    'currency'     => 'usd',
                    'product_data' => [
                        'name' => $roomData['name'],
                    ],
                    'unit_amount'  => $roomData['bookable']['rate'] * 100, // amount in cents
                ],
                'quantity'   => $validated['hours'],
            ];

            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addon) {
                    if ($addon['bookable_type'] === 'product') {
                        $lineItems[] = [
                            'price_data' => [
                                'currency'     => 'usd',
                                'product_data' => [
                                    'name' => $addon['product']['name'],
                                ],
                                'unit_amount'  => $addon['rate'] * 100,
                            ],
                            'quantity'   => $validated['hours'],
                        ];
                    } elseif ($addon['bookable_type'] === 'contractor') {
                        for ($i = 0; $i < $addon['quantity']; $i++) {
                            $lineItems[] = [
                                'price_data' => [
                                    'currency'     => 'usd',
                                    'product_data' => [
                                        'name' => $addon['role_name'],
                                    ],
                                    'unit_amount'  => $addon['rate'] * 100,
                                ],
                                'quantity'   => $validated['hours'],
                            ];
                        }
                    }
                }
            }

            $contractorsMetadata = [];
        
            foreach ($contractorEmails as $contractorType) {
                foreach ($contractorType['emails'] as $email) {
                    $contractorsMetadata[] = [
                        'role'  => $contractorType['role']['id'],
                        'email' => $email,
                    ];
                }
            }
            // Include order_id in metadata and create cancel URL with order id parameter
            $metadata = [
                'order_id' => $order->id,
                'contractors' => json_encode($contractorsMetadata),
            ];

            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'line_items'           => $lineItems,
                'mode'                 => 'payment',
                'success_url'          => route('payment.success') . '?session_id={CHECKOUT_SESSION_ID}',
                // Use a cancel URL that includes the order id
                'cancel_url'           => route('payment.cancel', ['order' => $order->id]),
                'metadata'             => $metadata,
            ]);

            // Everything succeeded; commit the transaction
            DB::commit();

            return response()->json(['checkout_url' => $session->url]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Checkout failed: " . $e->getMessage());
            return back()->withErrors(['error' => 'Failed to create booking: ' . $e->getMessage()]);
        }
    }

    /**
     * Cancel route to clean up if payment fails.
     * This route should be set as the Stripe Checkout cancel_url.
     */
    public function cancel(Request $request)
    {
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

        return redirect()->route('checkout')->with('error', 'Payment failed. Your booking was cancelled.');
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

            if ($session->payment_status !== 'paid') {
                return redirect()->route('checkout')->withErrors(['error' => 'Payment not completed.']);
            }

            // Retrieve the order from metadata
            $orderId = $session->metadata->order_id ?? null;
            if (!$orderId) {
                return redirect()->route('checkout')->withErrors(['error' => 'Order not found.']);
            }

            $order = Order::find($orderId);
            if (!$order) {
                return redirect()->route('checkout')->withErrors(['error' => 'Order not found in our records.']);
            }
            $order->status = $order->isCompleted() ? OrderStatus::COMPLETED : OrderStatus::PENDING;
            $order->save();
            // Now send confirmation emails since payment is successful
            $customer = $order->customer;
            $contractors = json_decode($session->metadata->contractors, true) ?? [];
            Mail::to($customer->email)->send(new OrderConfirmation($order));
            // Group emails by role ID.
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
            

            dd('Emails sent successfully');
            return view('success', ['order' => $order]);
        } catch (\Exception $e) {
            Log::error("Payment success processing error: " . $e->getMessage());
            dd($e->getMessage());
            return redirect()->route('checkout')->withErrors(['error' => 'An error occurred while processing payment success.']);
        }
    }
}
