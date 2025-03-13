<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    
    <div class="container mt-5">
        <h1>Thank you for your order!</h1>
        <br>
        <p>Dear <strong>{{ $customer->first_name ?? 'Customer' }},</strong></p>

        <p>Your order with ID <strong>{{ $order->id }}</strong> has been confirmed.</p>
        <p>Below are the details of your order:</p>
        <ul class="list-unstyled border border-secondary p-3">
            <li><strong>Order Date:</strong> &nbsp;{{ $order->created_at ? $order->created_at->toFormattedDateString() : 'N/A' }}</li>
            <li><strong>Total Amount:</strong> &nbsp;{{ $order->total_amount ? '$' . number_format($order->total_amount, 2) : 'N/A' }}</li>
            <li><strong>Order Status:</strong> &nbsp;{{ $order->status->value ?? 'N/A' }}</li>
        </ul>
        
        <p>Information:</p>
        <ul class="list-unstyled border border-secondary p-3">
            <li><strong>Customer Name:</strong> &nbsp;{{ $customer->first_name && $customer->last_name ? $customer->first_name . ' ' . $customer->last_name : 'N/A' }}</li>
            <li><strong>Email:</strong> &nbsp;{{ $customer->email ?? 'N/A' }}</li>
            <li><strong>Phone Number:</strong> &nbsp;{{ $customer->phone_number ?? 'N/A' }}</li>
        </ul>

        <p>Number of Booked Items: {{ $orderBookables->count() }}</p>

        @php
            // Group items by bookable_type, start_time, end_time, and status
            $groupedBookables = $orderBookables->groupBy(function ($bookable) {
                return $bookable->bookable_type . '|' . $bookable->start_time . '|' . $bookable->end_time . '|' . $bookable->status;
            });
        @endphp

        @if ($groupedBookables->count() > 0)
            <p class="mt-4"><strong>Booked Items:</strong></p>
            <table class="table table-bordered">
                <tr>
                    <th>Booked Item</th>
                    <th>Quantity</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                </tr>

                @foreach ($groupedBookables as $group => $bookables)
                    @php
                        // Extract first item to display shared info
                        $first = $bookables->first();
                        // Sum up quantities for this group
                        $totalQuantity = $bookables->sum('quantity');
                    @endphp
                    <tr>
                        <td>{{ str_replace(['ContractorRole'], ['Contractor'], class_basename($first->bookable_type)) }}</td>
                        <td>{{ $totalQuantity }}</td>
                        <td>{{ \Carbon\Carbon::parse($first->start_time)->format('M d, Y h:i A') }}</td>
                        <td>{{ \Carbon\Carbon::parse($first->end_time)->format('M d, Y h:i A') }}</td>
                        <td>
                            <span class="badge {{ $first->status == 'confirmed' ? 'bg-success' : 'bg-warning' }}">
                                {{ ucfirst($first->status) }}
                            </span>
                        </td>
                    </tr>
                @endforeach
            </table>
        @else
            <p>No booked items found.</p>
        @endif


        <p>We appreciate your business and hope you enjoy our services!</p>

        <p>
            Best regards,<br>
            <strong>Roomease Team</strong>
        </p>
    </div>
</body>
</html>
