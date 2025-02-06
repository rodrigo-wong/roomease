<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Bookable;
use App\Models\Contractor;
use App\Enums\BookableType;
use Illuminate\Http\Request;
use App\Models\OrderBookable;
use App\Models\ContractorRole;
use Illuminate\Support\Carbon;
use App\Models\ProductCategory;
use Illuminate\Validation\Rule;
use App\Models\BookableAvailability;

class BookableController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //dd(Bookable::contractors()->get());
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
        return Inertia::render('Bookables/Create', [
            'productCategories' => ProductCategory::all(),
            'contractorRoles' => ContractorRole::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Base validation for all bookables
            'name' => 'required|string|max:255',
            'rate' => 'required|nullable|numeric|min:0',
            'description' => 'nullable|string',
            'bookable_type' => ['required', Rule::in(BookableType::values())],
        ]);


        // Additional validation for contractors
        if ($request->bookable_type === 'contractor') {
            $request->validate([
                'role_id' => 'required|exists:contractor_roles,id',
                'phone_number' => 'required|string|max:255',
                'email' => 'required|string|email|max:255',
            ]);
        }

        if ($request->bookable_type === 'product') {
            $request->validate([
                'brand' => 'required|string|max:255',
                'serial_number' => 'required|string|max:255',
                'category_id' => 'required|exists:product_categories,id',
            ]);
        }

        if ($request->bookable_type === 'room') {
            $request->validate([
                'capacity' => 'required|integer|min:1',
            ]);
        }
        // Create the bookable
        $bookable = Bookable::create($validated);

        // If bookable is a contractor, store extra contractor details
        if ($request->bookable_type === 'contractor') {
            $bookable->contractor()->create([
                'name' => $request->name,
                'role_id' => $request->role_id,
                'phone_number' => $request->phone_number,
                'email' => $request->email,
            ]);
        }

        // If bookable is a product, store extra product details
        if ($request->bookable_type === 'product') {
            $bookable->product()->create([
                'name' => $request->name,
                'serial_number' => $request->serial_number,
                'brand' => $request->brand,
                'product_category_id' => $request->category_id,
                'description' => $request->description,
            ]);
        }

        if ($request->bookable_type === 'room') {
            $bookable->room()->create([
                'name' => $request->name,
                'description' => $request->description,
                'capacity' => $request->capacity,
            ]);
        }

        // Save availability slots using the relationship
        foreach ($request->availability as $day => $slots) {
            foreach ($slots as $slot) {
                if (!empty($slot['start_time']) && !empty($slot['end_time'])) {
                    $bookable->availability()->create([
                        'day_of_week' => $day,
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                    ]);
                }
            }
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
            ->collapse();


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
        $bookable->delete();
        return redirect()->back()->with('success', 'Bookable deleted successfully!');
    }

    /**
     * Get available times for a room on a given date.
     */
    public function getAvailableTimes(Request $request, Bookable $room)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'hours' => 'required|integer|min:2|max:24',
        ]);

        $date = $request->date;
        $bookingDuration = $request->hours * 60; // Convert hours to minutes
        $dayOfWeek = \Carbon\Carbon::parse($date)->dayOfWeek;

        // Fetch the room's availability for the given day of the week
        $availabilitySlots = $room->availability()
            ->where('day_of_week', $dayOfWeek)
            ->get()
            ->map(fn($slot) => [
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
            ]);

        // Fetch existing booked slots using the relationship
        $bookedSlots = $room->orders()
            ->whereDate('start_time', $date)
            ->get()
            ->map(fn($order) => [
                'start_time' => $order->start_time->format('H:i'),
                'end_time' => $order->end_time->format('H:i'),
            ]);

        // Break available slots into 30-minute intervals
        $availableSlots = collect();

        foreach ($availabilitySlots as $slot) {
            $startTime = Carbon::createFromFormat('H:i:s', $slot['start_time']);
            $endTime = Carbon::createFromFormat('H:i:s', $slot['end_time']);

            while ($startTime->addMinutes(30)->lte($endTime)) {
                $slotStart = $startTime->copy()->subMinutes(30)->format('H:i'); // Reset start
                $slotEnd = $startTime->copy()->addMinutes($bookingDuration - 30)->format('H:i'); // Full duration

                // Ensure the slot end is within the allowed time
                if ($slotEnd > $endTime->format('H:i')) {
                    break;
                }

                // Check if this booking period is fully available (no conflicts)
                $conflict = $bookedSlots->contains(
                    fn($booked) => ($slotStart < $booked['end_time']) && ($slotEnd > $booked['start_time'])
                );

                if (!$conflict) {
                    $availableSlots->push([
                        'start_time' => $slotStart,
                        'end_time' => $slotEnd,
                    ]);
                }
            }
        }

        return response()->json([
            'date' => $date,
            'available_slots' => $availableSlots->values(),
        ]);
    }

    /**
     * Get all available bookables (non-rooms) that are free for a given date and time slot.
     */
    public function getAvailableBookables(Request $request, Bookable $room)
    {

        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'timeslot' => 'required|array',
            'timeslot.start_time' => 'required|date_format:H:i',
            'timeslot.end_time' => 'required|date_format:H:i|after:timeslot.start_time',
        ]);

        $date = $request->date;
        $selectedStartTime = $request->timeslot['start_time'];
        $selectedEndTime = $request->timeslot['end_time'];

        // Fetch all bookables that are NOT rooms
        $availableBookables = Bookable::where('bookable_type', '!=', 'room')->get();

        // Fetch existing bookings for all non-room bookables on the requested date
        $bookedBookables = OrderBookable::whereDate('start_time', $date)
            ->get()
            ->groupBy('bookable_id'); // Group by bookable ID for faster lookup

        // Filter only bookables that are not booked for the selected timeslot
        $matchingBookables = $availableBookables->filter(function ($bookable) use ($bookedBookables, $selectedStartTime, $selectedEndTime) {
            if ($bookedBookables->has($bookable->id)) {
                $existingBookings = $bookedBookables->get($bookable->id);

                foreach ($existingBookings as $booking) {
                    if (
                        ($selectedStartTime < $booking->end_time->format('H:i')) &&
                        ($selectedEndTime > $booking->start_time->format('H:i'))
                    ) {
                        return false; // Conflict found, bookable is already taken
                    }
                }
            }

            return true; // Bookable is available for the selected timeslot
        });

        return response()->json([
            'date' => $date,
            'selected_timeslot' => [
                'start_time' => $selectedStartTime,
                'end_time' => $selectedEndTime,
            ],
            'available_bookables' => $matchingBookables->values(),
        ]);
    }
}
