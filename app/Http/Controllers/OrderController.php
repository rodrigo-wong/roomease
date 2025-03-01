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

class OrderController extends Controller
{
    public function orders()
    {

        $orders = Order::with(['orderBookables.bookable', 'customer'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $contractors = Contractor::with('role')->get();
        $contractorRoles = ContractorRole::all();
        $rooms = Room::all();
        $products = Product::all();

        return Inertia::render('Dashboard', [
            'orders' => $orders,
            'contractors' => $contractors,
            'contractorRoles' => $contractorRoles,
            'rooms' => $rooms,
            'products' => $products
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
