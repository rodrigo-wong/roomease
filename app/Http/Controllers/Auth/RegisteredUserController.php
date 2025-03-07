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
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }


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
