<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\AdminInvitation;

class UserController extends Controller
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
     * Display a list of admin users
     */
    public function index()
    {
        // Check super admin permission
        if ($redirect = $this->ensureSuperAdmin()) {
            return $redirect;
        }

        $currentUserId = Auth::id();

        $users = User::where('role', 'admin')
            ->orWhere('role', 'super_admin')
            ->get()
            ->map(function ($user) use ($currentUserId) {
                $user->is_current_user = $user->id === $currentUserId;
                return $user;
            });

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'isSuperAdmin' => true, // We know it's a super admin due to our check
        ]);
    }

    /**
     * Remove admin access
     */
    public function destroy(User $user)
    {
        // Check super admin permission
        if ($redirect = $this->ensureSuperAdmin()) {
            return $redirect;
        }

        // Don't allow revoking access for super admins or self
        if ($user->role === 'super_admin' || $user->id === Auth::id()) {
            return back()->with('error', 'Cannot revoke this user\'s access.');
        }

        // Find and delete the user's invitation
        AdminInvitation::where('email', $user->email)->delete();

        // Delete the user
        $user->delete();

        return back()->with('success', 'Admin access revoked successfully.');
    }
}
