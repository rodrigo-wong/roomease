<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdminInvitation;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\AdminInvitationMail;
use Illuminate\Support\Str;

class AdminInvitationController extends Controller
{
    /**
     * Helper method to check super admin status
     */
    private function ensureSuperAdmin()
    {
        if (!Auth::user() || Auth::user()->role !== 'super_admin') {
            return redirect()->route('dashboard')
                ->with('error', 'Only super administrators can perform this action.');
        }

        return null;
    }


    /**
     * Display a list of admin invitations
     */
    public function index()
    {
        // Check super admin permission
        if ($redirect = $this->ensureSuperAdmin()) {
            return $redirect;
        }

        // Get active and recently accepted invitations
        $invitations = AdminInvitation::with('inviter')
            ->where(function ($query) {
                $query->whereNull('accepted_at')
                    ->where('expires_at', '>', now());
            })
            ->orWhere('accepted_at', '>', now()->subDays(7))
            ->orderByDesc('created_at')
            ->get();



        return Inertia::render('Admin/Invitations/Index', [
            'invitations' => $invitations,
            'isSuperAdmin' => true,
        ]);
    }

    /**
     * Store a new admin invitation
     */
    public function store(Request $request)
    {
        // Check super admin permission
        if ($redirect = $this->ensureSuperAdmin()) {
            return $redirect;
        }

        // Validate email and ensure it's not already in use
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'unique:users,email',
                function ($attribute, $value, $fail) {
                    // Check if there's an active invitation for this email
                    $existingInvitation = AdminInvitation::where('email', $value)
                        ->whereNull('accepted_at')
                        ->where('expires_at', '>', now())
                        ->exists();

                    if ($existingInvitation) {
                        $fail('An invitation has already been sent to this email address.');
                    }
                }
            ]
        ]);

        // Create the invitation
        $invitation = new AdminInvitation();
        $invitation->email = $validated['email'];
        $invitation->token = Str::random(64); // Secure random token
        $invitation->invited_by = Auth::id();
        $invitation->expires_at = now()->addDays(7); // Valid for 7 days
        $invitation->save();

        // Send invitation email
        Mail::to($invitation->email)->send(new AdminInvitationMail($invitation));

        return back()->with('success', 'Invitation sent successfully');
    }

    /**
     * Delete an admin invitation
     */
    public function destroy(AdminInvitation $invitation)
    {
        // Check super admin permission
        if ($redirect = $this->ensureSuperAdmin()) {
            return $redirect;
        }

        // Prevent deleting accepted invitations
        if ($invitation->accepted_at) {
            return back()->with('error', 'Cannot delete accepted invitation');
        }

        $invitation->delete();

        return back()->with('success', 'Invitation deleted successfully');
    }
}
