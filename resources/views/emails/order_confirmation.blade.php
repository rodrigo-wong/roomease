<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
</head>
<body>
    <h1>Thank you for your order!</h1>

    <p>Dear {{ $order->customer_name ?? 'Customer' }},</p>

    <p>Your order with ID <strong>{{ $order->id }}</strong> has been confirmed.</p>

    <p><strong>Order Details:</strong></p>
    <ul>
        <li>Order Date: {{ $order->created_at->toFormattedDateString() }}</li>
        <li>Total Amount: ${{ number_format($order->total_amount, 2) }}</li>
        <!-- Add additional order details as needed -->
    </ul>

    <p>We appreciate your business and hope you enjoy our services!</p>

    <p>Best regards,<br>Room Booking App</p>
</body>
</html>
