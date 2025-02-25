<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Customer;
use App\Models\OrderBookable;
use App\Enums\OrderStatus;


class BookingController extends Controller
{
    public function store(Request $request)
    {
        try {
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
                'quantity' => 1,
                'start_time' => $validated['date'] . ' ' . $validated['timeslots'][0],
                'end_time' => $validated['date'] . ' ' . $validated['timeslots'][1],
            ]);

            //Create addon bookings if any
            if (!empty($validated['addons'])) {
                foreach ($validated['addons'] as $addonId) {
                    OrderBookable::create([
                        'order_id' => $order->id,
                        'bookable_id' => $addonId,
                        'quantity' => 1,
                        'start_time' => $validated['date'] . ' ' . $validated['timeslots'][0],
                        'end_time' => $validated['date'] . ' ' . $validated['timeslots'][1],
                    ]);
                }
            }



            return back()->with('success', 'Booking created successfully!');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to create booking: ' . $e->getMessage()
            ]);
        }
    }
}
