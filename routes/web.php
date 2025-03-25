<?php

use Inertia\Inertia;
use App\Models\Order;
use App\Models\Bookable;
use App\Models\OrderBookable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Session;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BookableController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ContractorController;
use App\Http\Controllers\ContractorRoleController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductCategoryController;

Route::get('/', function () {
    // Log::info('Session: '.  session()->getId());
    // Log::info('Session: ',  session()->all());
    // if (session()->has('payment_intent')) {
    //     $paymentIntentId = session('payment_intent');
    //     $paymentIntent = \Stripe\PaymentIntent::retrieve($paymentIntentId);
    //     $paymentIntent->cancel();
    //     session()->forget('payment_intent');
    //     dd($paymentIntentId);
    // }
    return Inertia::render('Booking', [
        'rooms' => Bookable::rooms()->get(),
    ]);
})->name('client.home');


Route::get('/test', function () {
    $order = Order::find(80);
    $orderDetails = $order->orderBookables()->with('bookable')->get();
});
Route::get('/time-slots/{room}', [BookableController::class, 'getAvailableTimes'])->name('bookable.time-slots');
Route::get('/available/bookables', [BookableController::class, 'getAvailableBookables'])->name('bookable.available');

Route::post('/payment/{order}', [PaymentController::class, 'store'])->name('payment.store');


Route::get('/dashboard', [OrderController::class, 'orders'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::post('/orders/assign-contractor', [OrderController::class, 'assignContractor'])
    ->middleware(['auth'])
    ->name('orders.assign-contractor');

Route::post('/orders/admin-booking', [OrderController::class, 'createAdminBooking'])
    ->name('orders.admin-booking')
    ->middleware(['auth']);


Route::get('/contractor/confirmation', [ContractorController::class, 'confirm'])
    ->name('contractor.confirmation')
    ->middleware('signed');


Route::post('/booking', [BookingController::class, 'store'])->name('booking.store');
Route::post('/order/{order}', [OrderController::class, 'destroy'])->name('order.destroy');

Route::post('/checkout', [CheckoutController::class, 'checkout'])->name('checkout');
Route::get('/success', [CheckoutController::class, 'success'])->name('payment.success');
Route::get('/cancel', [CheckoutController::class, 'cancel'])->name('payment.cancel');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('bookables', BookableController::class);
    Route::post('/product/category', [ProductCategoryController::class, 'store'])->name('product.category.store');
    Route::post('/contractor/role', [ContractorRoleController::class, 'store'])->name('contractor.role.store');
});

require __DIR__ . '/auth.php';
