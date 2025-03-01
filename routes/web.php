<?php

use Inertia\Inertia;
use App\Models\Bookable;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BookableController;
use App\Http\Controllers\ContractorRoleController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContractorController;
use App\Http\Controllers\OrderController;

Route::get('/', function () {
    return Inertia::render('Booking', [
        'rooms' => Bookable::rooms()->get(),
    ]);
});
Route::get('/time-slots/{room}', [BookableController::class, 'getAvailableTimes'])->name('bookable.time-slots');
Route::get('/available/bookables', [BookableController::class, 'getAvailableBookables'])->name('bookable.available');


Route::get('/dashboard', [OrderController::class, 'orders'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::post('/orders/assign-contractor', [OrderController::class, 'assignContractor'])
    ->middleware(['auth'])
    ->name('orders.assign-contractor');


Route::get('/contractor/confirmation', [ContractorController::class, 'confirm'])
    ->name('contractor.confirmation')
    ->middleware('signed');

Route::post('/booking', [BookingController::class, 'store'])->name('booking.store');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('bookables', BookableController::class);
    Route::post('/product/category', [ProductCategoryController::class, 'store'])->name('product.category.store');
    Route::post('/contractor/role', [ContractorRoleController::class, 'store'])->name('contractor.role.store');
});

require __DIR__ . '/auth.php';
