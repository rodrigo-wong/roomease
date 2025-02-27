<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use App\Models\OrderBookable;
use App\Models\ContractorRole;
use App\Mail\OrderConfirmation;
use App\Enums\OrderBookableStatus;
use Illuminate\Support\Facades\Log;
use App\Mail\ContractorConfirmation;
use Illuminate\Support\Facades\Mail;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        // dd($request->all());
        // try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email',
                'phone_number' => 'required|string',
                'room_id' => 'required|exists:bookables,id',
                'date' => 'required|date',
                'timeslots' => 'required|array',
                'addons' => 'nullable|array',
                'total_amount' => 'required|numeric',
                'hours' => 'required|integer|min:1'
            ]);

            //Find or create customer
            $customer = Customer::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone_number' => $validated['phone_number']
                ]
            );

            //Create order
            $order = Order::create([
                'customer_id' => $customer->id,
                'total_amount' => $validated['total_amount'],
                'status' => OrderStatus::PENDING,
            ]);

            //Create room booking
            OrderBookable::create([
                'order_id' => $order->id,
                'bookable_id' => $validated['room_id'],
                'bookable_type' => Room::class,
                'quantity' => 1,
                'status' => OrderBookableStatus::CONFIRMED,
                'start_time' => $validated['date'] . ' ' . $validated['timeslots'][0],
                'end_time' => $validated['date'] . ' ' . $validated['timeslots'][1],
            ]);

            $contractorEmails = [];
            // Create addon bookings if any
            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addon) {
                    $orderData = [
                        'order_id' => $order->id,
                        'bookable_id' => $addon['bookable_type'] === 'product' ? $addon['id'] : $addon['role'],
                        'bookable_type' => $addon['bookable_type'] === 'product' ? Product::class : ContractorRole::class,
                        'quantity' => 1,
                        'status' => $addon['bookable_type'] === 'product' ? OrderBookableStatus::CONFIRMED : OrderBookableStatus::PENDING,
                        'start_time' => $validated['date'] . ' ' . $validated['timeslots'][0],
                        'end_time' => $validated['date'] . ' ' . $validated['timeslots'][1],
                    ];

                    $quantity = isset($addon['quantity']) ? $addon['quantity'] : 1;
                    for ($i = 0; $i < $quantity; $i++) {
                        OrderBookable::create($orderData);
                    }
                    if ($addon['bookable_type'] === 'contractor') {
                        $contractorEmails[] = ['role' => ContractorRole::find($addon['role']), 'emails' => $addon['emails']];
                    }
                }
            }

            // Mail::to($customer->email)->send(new OrderConfirmation($order));
            foreach ($contractorEmails as $contractorType) {
                foreach ($contractorType['emails'] as $email) {
                    Mail::to($email)->send(new ContractorConfirmation($order, $contractorType['role'], $email));
                }
            }

            return back()->with('success', 'Booking created successfully!');
        // } catch (\Exception $e) {
        //     Log::error($e->getMessage());
        //     return back()->withErrors([
        //         'error' => 'Failed to create booking: ' . $e->getMessage()
        //     ]);
        // }
    }
}
