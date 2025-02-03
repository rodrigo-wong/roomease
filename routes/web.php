<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BookableController;
use App\Models\Bookable;

Route::get('/', function () {
    return Inertia::render('Booking', [
        'rooms' => Bookable::rooms()->get(),
    ]);
});
Route::get('/time-slots/{room}', [BookableController::class, 'getAvailableTimes'])->name('bookable.time-slots');
Route::get('/available/bookables', [BookableController::class, 'getAvailableBookables'])->name('bookable.available');
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/test', function () {
    return Inertia::render('Test');
})->name('test');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    Route::resource('bookables', BookableController::class);

});

require __DIR__.'/auth.php';
