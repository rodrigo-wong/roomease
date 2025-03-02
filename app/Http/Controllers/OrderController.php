<?php

namespace App\Http\Controllers;

use App\Enums\OrderBookableStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Contractor;
use App\Models\ContractorRole;
use App\Models\OrderBookable;
use App\Models\Room;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Bookable;


class OrderController extends Controller
{
    public function orders(Request $request)
    {
        $search = $request->input('search');
        $timeFilter = $request->input('timeFilter', 'all');
        $statusFilter = $request->input('statusFilter', 'all');

        $query = Order::with(['orderBookables.bookable', 'customer'])
            ->select('orders.*')
            ->addSelect(DB::raw('(SELECT start_time FROM order_bookables WHERE order_bookables.order_id = orders.id LIMIT 1) as booking_time'));

        // Apply search filter if provided
        if ($search) {
            $query->whereHas('customer', function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(first_name, ' ', last_name)"), 'LIKE', "%{$search}%");
            });
        }

        // Apply time filter
        if ($timeFilter !== 'all') {
            //$now = now(); //UTC default timezone
            $now = now()->timezone('America/New_York');
            if ($timeFilter === 'future') {
                $query->whereExists(function ($q) use ($now) {
                    $q->select(DB::raw(1))
                        ->from('order_bookables')
                        ->whereColumn('order_bookables.order_id', 'orders.id')
                        ->where('end_time', '>', $now);
                });
            } else if ($timeFilter === 'past') {
                $query->whereExists(function ($q) use ($now) {
                    $q->select(DB::raw(1))
                        ->from('order_bookables')
                        ->whereColumn('order_bookables.order_id', 'orders.id')
                        ->where('end_time', '<=', $now);
                });
            }
        }

        // Apply status filter
        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        // Apply sorting
        $orders = $query->orderBy('booking_time', 'asc')
            ->paginate(10)
            ->withQueryString();



        $contractors = Contractor::with('role')->get();
        $contractorRoles = ContractorRole::all();
        $rooms = Room::all();
        $products = Product::all();

        return Inertia::render('Dashboard', [
            'orders' => $orders,
            'contractors' => $contractors,
            'contractorRoles' => $contractorRoles,
            'rooms' => $rooms,
            'products' => $products,
            'filters' => [
                'search' => $search,
                'timeFilter' => $timeFilter,
                'statusFilter' => $statusFilter,
            ],
        ]);
    }
    public function assignContractor(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'order_bookable_id' => 'required|exists:order_bookables,id',
            'contractor_id' => 'required|exists:contractors,id',
        ]);

        $orderBookable = OrderBookable::find($validated['order_bookable_id']);
        $orderBookable->bookable_id = $validated['contractor_id'];
        $orderBookable->bookable_type = Contractor::class;
        $orderBookable->status = OrderBookableStatus::CONFIRMED;
        $orderBookable->save();

        $order = Order::find($validated['order_id']);
        if ($order->isCompleted()) {
            $order->status = OrderStatus::COMPLETED;
            $order->save();
        }

        return back()->with('success', 'Contractor assigned successfully');
    }

    public function createAdminBooking(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:bookables,id',
            'date' => 'required|date|after_or_equal:today',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'note' => 'nullable|string',
        ]);

        //combine date and time
        $startDateTime = $validated['date'] . ' ' . $validated['start_time'] . ':00';
        $endDateTime = $validated['date'] . ' ' . $validated['end_time'] . ':00';

        // Check if room is available
        $isRoomAvailable = $this->checkRoomAvailability(
            $validated['room_id'],
            $startDateTime,
            $endDateTime
        );

        if (!$isRoomAvailable) {
            return redirect()->back()->withErrors([
                'room_id' => 'This room is already booked for the selected time period.'
            ]);
        }

        //Get the authneticated admin
        $admin = Auth::user();

        //Find or create a customer record for this admin user
        $customer = Customer::firstOrCreate(
            ['email' => $admin->email],
            [
                'first_name' => $admin->name,
                'last_name' => ' - Admin',
                'phone_number' => '000000000'
            ]
        );

        //calculate duration
        $startTime = new \DateTime($startDateTime);
        $endTime = new \DateTime($endDateTime);
        $totalMinutes = ($endTime->getTimestamp() - $startTime->getTimestamp()) / 60;
        $hours = $totalMinutes / 60;

        //Get the room rate
        $bookable = Bookable::find($validated['room_id']);
        $hourlyRate = $bookable->rate;

        //calculate total amount
        $totalAmount = $hours * $hourlyRate;

        //create order
        $order = new Order();
        $order->customer_id = $customer->id;
        $order->status = OrderStatus::ADMIN_RESERVED;
        $order->total_amount = $totalAmount;
        $order->notes = $validated['note'] ?? 'Reserved by admin ' . $admin->name;
        $order->save();

        //Create the order bookable
        $orderBookable = new OrderBookable();
        $orderBookable->order_id = $order->id;
        $orderBookable->bookable_type = Room::class;
        $orderBookable->bookable_id = $validated['room_id'];
        $orderBookable->start_time = $startDateTime;
        $orderBookable->end_time = $endDateTime;
        $orderBookable->quantity = 1;
        $orderBookable->status = OrderBookableStatus::ADMIN_BLOCKED;
        $orderBookable->save();

        return redirect()->route('dashboard')->with('success', 'Room has been successfully blocked for the selected time period.');
    }

    // Helper method to check if room is available
    private function checkRoomAvailability($roomId, $startTime, $endTime)
    {
        // Find any overlapping bookings
        $conflictingBookings = OrderBookable::where('bookable_id', $roomId)
            ->where('bookable_type', Room::class)
            ->where('status', '!=', OrderBookableStatus::CANCELLED)
            ->where(function ($query) use ($startTime, $endTime) {
                // Start time falls within existing booking
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<=', $startTime)
                        ->where('end_time', '>', $startTime);
                })
                    // End time falls within existing booking
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                            ->where('end_time', '>=', $endTime);
                    })
                    // Booking completely contains the requested period
                    ->orWhere(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '>=', $startTime)
                            ->where('end_time', '<=', $endTime);
                    });
            })
            ->count();

        return $conflictingBookings === 0;
    }
}
