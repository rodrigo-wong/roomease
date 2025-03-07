<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\AdminInvitationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {

    // Invitation-based registration routes
    Route::get('register/{token}', [RegisteredUserController::class, 'createWithInvitation'])
        ->name('register.with.invitation');
    Route::post('register/{token}', [RegisteredUserController::class, 'storeWithInvitation'])
        ->name('register.with.invitation.store');

    //login and password reset routes
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
    //Admin invitation management routes
    Route::get('admin/invitations', [AdminInvitationController::class, 'index'])
        ->name('admin.invitations.index');
    Route::post('admin/invitations', [AdminInvitationController::class, 'store'])
        ->name('admin.invitations.store');
    Route::delete('admin/invitations/{invitation}', [AdminInvitationController::class, 'destroy'])
        ->name('admin.invitations.destroy');

    //Admin user management routes
    Route::get('admin/users', [UserController::class, 'index'])
        ->name('admin.users.index');
    Route::delete('admin/users/{user}', [UserController::class, 'destroy'])
        ->name('admin.users.destroy');
});
