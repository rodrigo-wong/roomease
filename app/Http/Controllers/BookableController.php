<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Bookable;
use App\Enums\BookableType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\BookableAvailability;

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
        // Save availability slots
        foreach ($request->availability as $day => $slots) {
            foreach ($slots as $slot) {
                if (!empty($slot['start_time']) && !empty($slot['end_time'])) {
                    BookableAvailability::create([
                        'bookable_id' => $bookable->id,
                        'day_of_week' => $day,
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                    ]);
                }
            }
        }

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
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            $bookable->load('contractor');
        }

        // Load bookable availability
        $bookable->load('availability');

        return Inertia::render('Bookables/Edit', [
            'bookable' => $bookable
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bookable $bookable)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'email' => Rule::requiredIf($bookable->bookable_type === BookableType::CONTRACTOR->value) . '|nullable|string|email|max:255',
            'phone_number' => Rule::requiredIf($bookable->bookable_type === BookableType::CONTRACTOR->value) . '|nullable|string|max:255',
            'role' => Rule::requiredIf($bookable->bookable_type === BookableType::CONTRACTOR->value) . '|nullable|string|max:255',
            'availability' => 'nullable|array',
        ]);

        // Update bookable details
        $bookable->update($validated);

        // Update contractor details if applicable
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            $bookable->contractor->update([
                'role' => $request->role,
                'phone_number' => $request->phone_number,
                'email' => $request->email,
            ]);
        }

        // Convert availability array to a flat structure with `day_of_week`
        $newAvailabilities = collect($request->availability ?? [])
            ->map(function ($slots, $dayOfWeek) {
                return collect($slots)->map(function ($slot) use ($dayOfWeek) {
                    return [
                        'day_of_week' => $dayOfWeek,
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                    ];
                });
            })
            ->flatten(); 


        // Load existing availabilities
        $existingAvailabilities = $bookable->availability->keyBy(function ($availability) {
            return "{$availability->day_of_week}-{$availability->start_time}-{$availability->end_time}";
        });

        // Delete old availabilities that were removed
        $existingAvailabilities->each(function ($availability) use ($newAvailabilities) {
            $exists = $newAvailabilities->contains(function ($slot) use ($availability) {
                return $slot['day_of_week'] == $availability->day_of_week &&
                    $slot['start_time'] == $availability->start_time &&
                    $slot['end_time'] == $availability->end_time;
            });

            if (!$exists) {
                $availability->delete();
            }
        });

        // Add new availability slots
        foreach ($newAvailabilities as $slot) {
            if (!empty($slot['start_time']) && !empty($slot['end_time'])) {
                BookableAvailability::updateOrCreate([
                    'bookable_id' => $bookable->id,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                ]);
            }
        }

        return redirect()->route('bookables.index')->with('success', 'Bookable updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bookable $bookable)
    {
        //
        $bookable->delete();
        return redirect()->route('bookables.index')->with('success', 'Bookable deleted successfully!');
    }
}
