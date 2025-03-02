<?php

namespace App\Http\Controllers;

use App\Enums\OrderBookableStatus;
use App\Enums\OrderStatus;
use App\Models\Order;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Contractor;
use App\Models\ContractorRole;
use App\Models\OrderBookable;
use App\Models\Room;
use App\Models\Product;
use Illuminate\Support\Facades\DB;


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
}
