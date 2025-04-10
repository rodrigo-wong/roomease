<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\Contractor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use App\Models\ContractorRole;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Queue\SerializesModels;

class ContractorConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * The order instance.
     *
     * @var \App\Models\Order
     */
    public $order;

    /**
     * The order details instance.
     */
    public $orderDetails;

    /**
     * The customer instance.
     * @var \App\Models\Customer
     */
    public $customer;

    /**
     * The contractor role instance.
     * @var \App\Models\ContractorRole
     */
    public $contractorRole;


    /**
     * The contractor 
     * @var \App\Models\Contractor
     */
    public $contractor;

    /**
     *  The signed URL
     */
    public $signedUrl;
    
    /**
     * Create a new message instance.
     *
     * @param  \App\Models\Order  $order
     * @return void
     */
    public function __construct(Order $order, ContractorRole $contractorRole, string $email)
    {
        $this->order = $order->load('orderBookables.bookable');
        $this->customer = $order->customer;
        $this->contractorRole = $contractorRole;
        $this->contractor = Contractor::where('email', $email)->where('role_id', $contractorRole->id)->first();
        // Generate a signed URL for the contractor confirmation endpoint.
        $this->signedUrl = URL::signedRoute('contractor.confirmation', [
            'order_id' => $this->order->id,
            'contractor_id' => $this->contractor->id,
            'role_id' => $this->contractorRole->id,
        ]);
            
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Roomease Job Opportunity')
            ->view('emails.contractor_confirmation')
            ->with([
                'order' => $this->order,
                'contractorRole' => $this->contractorRole,
                'customer' => $this->customer,
            ]);
    }
}
