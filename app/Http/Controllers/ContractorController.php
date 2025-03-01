<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Enums\OrderStatus;
use App\Models\Contractor;
use Illuminate\Http\Request;
use App\Models\OrderBookable;
use App\Models\ContractorRole;
use App\Enums\OrderBookableStatus;
use Illuminate\Support\Facades\Log;

class ContractorController extends Controller
{
    public function confirm(Request $request)
    {
        Log::info($request->all());
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'contractor_id' => 'required|exists:contractors,id',
            'role_id' => 'required|exists:contractor_roles,id'
        ]);
        
        /**
         * @var Order $order
         */
        $order = Order::findOrFail($request->order_id);
        /*
        * @var OrderBookable $orderBookableToBeFilled
        */
        $orderBookableToBeFilled = $order->orderBookables()->where('status', OrderStatus::PENDING)->where('bookable_type', ContractorRole::class)->where('bookable_id', $validated['role_id'])->first();;
        if(!$orderBookableToBeFilled) {
                    // TODO: Inertia returned a React file for confirm landing page

            dd("Job already taken");
        } else {
            $orderBookableToBeFilled->status = OrderBookableStatus::CONFIRMED;
            $orderBookableToBeFilled->bookable_id = $validated['contractor_id'];
            $orderBookableToBeFilled->bookable_type = Contractor::class;
            $orderBookableToBeFilled->save();
        }

        // dd($order->isCompleted());
        if($order->isCompleted()) {
            $order->status = OrderStatus::COMPLETED;
        }
        $order->save();


        // TODO: Inertia returned a React file for confirm landing page
        dd("Contractor confirmed");

        return redirect()->back();
    }
}
