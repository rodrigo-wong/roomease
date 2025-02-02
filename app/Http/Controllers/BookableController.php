<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Bookable;
use App\Enums\BookableType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
        // Base validation for all bookables
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'bookable_type' => ['required', Rule::in(BookableType::values())]
        ]);

        // Additional validation for contractors
        if ($request->bookable_type === 'contractor') {
            $request->validate([
                'role' => 'required|string|max:255',
                'phone_number' => 'required|string|max:255',
                'email' => 'required|string|email|max:255',
            ]);
        }

        // Create the bookable
        $bookable = Bookable::create($validated);

        // If bookable is a contractor, store extra contractor details
        if ($request->bookable_type === 'contractor') {
            $bookable->contractor()->create([
                'role' => $request->role,
                'phone_number' => $request->phone_number,
                'email' => $request->email,
            ]);
        }

        return redirect()->route('bookables.index')->with('success', 'Bookable created successfully!');
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
