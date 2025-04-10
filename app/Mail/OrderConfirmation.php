<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;

class OrderConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The order instance.
     *
     * @var \App\Models\Order
     */
    public $order;
    public $orderDetails;
    public $customer;
    public $orderBookables;

    /**
     * Create a new message instance.
     *
     * @param  \App\Models\Order  $order
     * @return void
     */
    public function __construct(Order $order)
    {
        $this->order = $order->load('orderBookables.bookable');
        $this->orderDetails = $order->details();
        Log::info($this->order);
        $this->orderBookables = $order->orderBookables;
        $this->customer = $order->customer;
        Log::info($this->customer);
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Your Order Confirmation')
                    ->view('emails.order_confirmation')
                    ->with([
                        'order' => $this->order,
                        'orderBookables' => $this->orderBookables,
                        'customer' => $this->customer
                    ]);
    }
}
