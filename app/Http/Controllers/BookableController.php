<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Bookable;
use Illuminate\Http\Request;

class BookableController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Bookables/Index', [
            'products' => fn() => Bookable::products()->get(),
            'rooms' => fn() => Bookable::rooms()->get(),
            'contractors' => fn() => Bookable::contractors()->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Bookables/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Bookable $bookable)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Bookable $bookable)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bookable $bookable)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bookable $bookable)
    {
        //
    }
}
