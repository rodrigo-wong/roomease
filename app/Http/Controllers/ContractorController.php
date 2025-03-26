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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Traits\CacheInvalidationTrait;
use Inertia\Inertia;
use Illuminate\Support\Facades\Session;

class ContractorController extends Controller
{
    use CacheInvalidationTrait;

    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'contractor_id' => 'required|exists:contractors,id',
            'role_id' => 'required|exists:contractor_roles,id'
        ]);
    
        $order = Order::findOrFail($request->order_id);
        $contractor = Contractor::find($validated['contractor_id']);
        
        // Unique session key to track if this contractor already accepted this job
        $sessionKey = 'job_accepted_' . $validated['order_id'] . '_' . $validated['contractor_id'];
    
        // ✅ If they already accepted it earlier in this session, show success again
        if (Session::has($sessionKey)) {
            return Inertia::render('Landing/ContractorsLandingPage', [
                'status' => 1,
                'message' => 'You have successfully booked this job',
                'person' => $contractor,
            ]);
        }
    
        // Check if the job is still available
        $orderBookableToBeFilled = $order->orderBookables()
            ->where('status', OrderStatus::PENDING)
            ->where('bookable_type', ContractorRole::class)
            ->where('bookable_id', $validated['role_id'])
            ->first();
    
        if (!$orderBookableToBeFilled) {
            // ❌ Job already taken (but not by this contractor in this session)
            return Inertia::render('Landing/ContractorsLandingPage', [
                'status' => -1,
                'message' => 'Someone already took this job',
                'person' => $contractor,
            ]);
        }
    
        // Book the job
        $orderBookableToBeFilled->status = OrderBookableStatus::CONFIRMED;
        $orderBookableToBeFilled->bookable_id = $validated['contractor_id'];
        $orderBookableToBeFilled->bookable_type = Contractor::class;
        $orderBookableToBeFilled->save();
    
        if ($order->isCompleted()) {
            $order->status = OrderStatus::COMPLETED;
            $order->save();
        }
    
        $this->invalidateOrdersCache();
        Cache::forget('contractors');
    
        // Mark in session that this contractor got this job
        Session::put($sessionKey, true);
    
        return Inertia::render('Landing/ContractorsLandingPage', [
            'status' => 1,
            'message' => 'You have successfully booked this job',
            'person' => $contractor,
        ]);
    }

}
