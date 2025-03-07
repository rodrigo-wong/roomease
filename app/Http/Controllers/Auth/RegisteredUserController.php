<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\AdminInvitation;

class RegisteredUserController extends Controller
{

    /**
     * Display the invitation-based registration view.
     */
    public function createWithInvitation(string $token)
    {
        // Find and validate the invitation
        $invitation = AdminInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        // If invitation not found or invalid, return a 403 error
        if (!$invitation) {
            abort(403, 'This invitation link is invalid or has expired.');
        }

        return Inertia::render('Auth/RegisterWithInvitation', [
            'email' => $invitation->email,
            'token' => $token,
        ]);
    }

    /**
     * Handle an incoming invitation-based registration request.
     */
    public function storeWithInvitation(Request $request, string $token)
    {
        // Find and validate the invitation
        $invitation = AdminInvitation::where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        // If invitation not found or invalid, return a 403 error
        if (!$invitation) {
            abort(403, 'This invitation link is invalid or has expired.');
        }

        // Validate the registration data
        $request->validate([
            'name' => 'required|string|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Create the user with the email from the invitation
        $user = User::create([
            'name' => $request->name,
            'email' => $invitation->email, // Email comes from invitation for security
            'role' => 'admin', // All invited users are admins
            'password' => Hash::make($request->password),
        ]);

        // Mark invitation as accepted
        $invitation->accepted_at = now();
        $invitation->save();


        // Log the user in
        Auth::login($user);

        // Redirect to dashboard
        return redirect(route('dashboard'));
    }
}
