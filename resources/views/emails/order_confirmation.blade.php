<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Order Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background-color: #f9f9f9;
            color: #333;
        }

        h1,
        h2 {
            color: #2c3e50;
            margin-bottom: 16px;
        }

        .section {
            margin-bottom: 40px;
        }

        .box {
            padding: 16px;
            background-color: #fff;
            border: 1px solid #ccc;
            border-radius: 6px;
            margin-top: 10px;
        }

        .box p {
            margin: 6px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            background-color: #fff;
        }

        thead {
            background-color: #e5e7eb;
        }

        th,
        td {
            padding: 10px;
            border: 1px solid #d1d5db;
            text-align: left;
        }

        tfoot td {
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }
    </style>
</head>

<body>

    <div class="section">
        <h1>Thank you for your order!</h1>
        <p>Dear <strong>{{ $orderDetails['order']->customer->first_name ?? 'Customer' }}</strong>,</p>
        <p>Your order with ID <strong>{{ $orderDetails['order']->id }}</strong> has been confirmed.</p>
    </div>

    <div class="section">
        <h2>Order Details</h2>
        <div class="box">
            <p><strong>Order Date:</strong> {{ \Carbon\Carbon::parse($orderDetails['order']->created_at)->toFormattedDateString() ?? 'N/A' }}</p>
            <p><strong>Booked For:</strong> {{ \Carbon\Carbon::parse($orderDetails['order']->start_time)->format('M d, Y h:i A') ?? 'N/A' }}</p>
            <p><strong>Duration (Hours):</strong> {{ $orderDetails['order']->hours ?? 'N/A' }}</p>
            <p><strong>Total Amount:</strong> ${{ number_format($orderDetails['order']->total_amount, 2) }}</p>
        </div>
    </div>

    <div class="section">
        <h2>Customer Information</h2>
        <div class="box">
            <p><strong>Name:</strong> {{ $orderDetails['order']->customer->first_name }} {{ $orderDetails['order']->customer->last_name }}</p>
            <p><strong>Email:</strong> {{ $orderDetails['order']->customer->email }}</p>
            <p><strong>Phone:</strong> {{ $orderDetails['order']->customer->phone_number }}</p>
        </div>
    </div>

    <div class="section">
        <h2>Items</h2>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Rate</th>
                    <th>Quantity</th>
                    <th>Hours</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @php $grandTotal = 0; @endphp

                @if($orderDetails['items']->count() > 0)
                @foreach($orderDetails['items'] as $item)
                @php
                $rate = floatval($item['rate']);
                $quantity = intval($item['quantity']);
                $hours = floatval($orderDetails['order']->hours ?? 1);
                $total = $rate * $quantity * $hours;
                $grandTotal += $total;
                @endphp
                <tr>
                    <td>{{ $item['name'] }}</td>
                    <td>{{ $item['description'] }}</td>
                    <td>${{ number_format($rate, 2) }}</td>
                    <td>{{ $quantity }}</td>
                    <td>{{ $hours }}</td>
                    <td>${{ number_format($total, 2) }}</td>
                </tr>
                @endforeach
                @else
                <tr>
                    <td colspan="6" class="text-center">No items found.</td>
                </tr>
                @endif
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" class="text-right font-bold">Grand Total:</td>
                    <td class="font-bold">${{ number_format($grandTotal, 2) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="section">
        <p>We appreciate your business and hope you enjoy our services!</p>
        <p>
            Best regards,<br>
            <strong>Roomease Team</strong>
        </p>
    </div>

</body>

</html>