<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Roomease Job Opportunity</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
        }

        .container {
            margin: 0 auto;
            padding: 20px;
            max-width: 600px;
        }

        .header {
            margin-bottom: 20px;
        }

        .job-details,
        .customer-details {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
        }

        h1,
        h2 {
            color: #444;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Job Opportunity: {{ $contractorRole->name }}</h1>
            <p>Dear {{ explode(' ', $contractor->name)[0] }} ,</p>
            <p>You have been offered a job opportunity from Roomease. Please review the details below.</p>
        </div>

        @php
        // Find the booking entry that corresponds to the contractor role.
        $booking = $order->orderBookables->first(function($bookable) use ($contractorRole) {
        return $bookable->bookable_type == 'App\\Models\\ContractorRole' && $bookable->bookable_id == $contractorRole->id;
        });
        @endphp

        <div class="job-details">
            <h2>Job Details</h2>
            <p><strong>Role:</strong> {{ $contractorRole->name }}</p>
            @if($booking)
            <p>
                <strong>Date:</strong>
                {{ \Carbon\Carbon::parse($booking->start_time)->format('Y-m-d') }}
            </p>
            <p>
                <strong>Start Time:</strong>
                {{ \Carbon\Carbon::parse($booking->start_time)->format('H:i') }}
            </p>
            <p>
                <strong>End Time:</strong>
                {{ \Carbon\Carbon::parse($booking->end_time)->format('H:i') }}
            </p>
            @else
            <p>No booking details available.</p>
            @endif
        </div>

        <div class="customer-details">
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> {{ $customer->full_name }}</p>
            <p><strong>Email:</strong> {{ $customer->email }}</p>
            <p><strong>Phone:</strong> {{ $customer->phone_number }}</p>
        </div>

        <p>If you are interested in this opportunity, please click <a href="{{$signedUrl}}">here</a> to accept the job</p>
        <p>Thank you,<br>Roomease Team</p>
    </div>
</body>

</html>