<!DOCTYPE html>
<html>

<head>
    <title>Admin Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
        }

        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>

<body>
    <h1>You're Invited to Join RoomEase as an Administrator</h1>

    <p>Hello,</p>

    <p>You have been invited to join the RoomEase administration team. As an administrator, you'll have access to manage bookings, rooms, contractors, and other aspects of the system.</p>

    <p>Please click the button below to set up your admin account:</p>

    <a href="{{ url('/register/' . $invitation->token) }}" class="button">Accept Invitation</a>

    <p>This invitation will expire on <strong>{{ $invitation->expires_at->format('F j, Y') }}</strong>, so please complete your registration before then.</p>

    <p>If you did not expect to receive this invitation, you can safely ignore this email.</p>

    <div class="footer">
        <p>RoomEase - Room Booking System</p>
    </div>
</body>

</html>