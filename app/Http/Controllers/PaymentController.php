<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Enums\PaymentStatus;
use Illuminate\Http\Request;
use App\Models\ContractorRole;
use App\Mail\OrderConfirmation;
use App\Mail\ContractorConfirmation;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'payment_intent' => 'required|string',
            'contractors' => 'nullable|array',
        ]);

        $payment = $order->payment;
        if($payment->stripe_payment_intent_id !== $validated['payment_intent']) {
            return redirect()->back()->withErrors('error', 'Payment intent does not match');
        }
        $payment->status = PaymentStatus::SUCCEEDED->value;
        $payment->save();
        $customer = $order->customer;
        // Send confirmation emails.
        Mail::to($customer->email)->send(new OrderConfirmation($order));

        // Send contractor emails if applicable.
        $contractorEmails = [];
        if (!empty($validated['contractors'])) {
            foreach ($validated['contractors'] as $contractor) {
                if ($contractor['bookable_type'] === 'contractor') {
                    $contractorEmails[] = [
                        'role'   => ContractorRole::find($contractor['role']),
                        'emails' => $contractor['emails']
                    ];
                }
            }
        }

        foreach ($contractorEmails as $contractorType) {
            foreach ($contractorType['emails'] as $email) {
                Mail::to($email)->send(new ContractorConfirmation($order, $contractorType['role'], $email));
            }
        }
        dd("Order confirmed and Payment successful");
        return redirect()->back()->with('success', 'Payment successful');
    }
}
