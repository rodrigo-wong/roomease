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
use Illuminate\Support\Facades\Log;
use App\Models\BookableAvailability;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Traits\CacheInvalidationTrait;

class BookableController extends Controller
{
    use CacheInvalidationTrait;
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
            Cache::forget('contractors');
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
            Cache::forget('products');
        }

        if ($request->bookable_type === 'room') {
            $bookable->room()->create([
                'name' => $request->name,
                'description' => $request->description,
                'capacity' => $request->capacity,
            ]);
            Cache::forget('rooms');
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



        return redirect()->route('bookables.index', ['tab' => $request->bookable_type . 's'])->with('success', 'Bookable created successfully!');
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
        $availability = $bookable->availability()
            ->get()
            ->groupBy('day_of_week')
            ->map(function ($slots) {
                return $slots->map(function ($slot) {
                    return [
                        'start_time' => $slot->start_time,
                        'end_time' => $slot->end_time,
                    ];
                });
            });
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            $bookable->load('contractor');
            if ($bookable->contractor) {
                $contractorData = $bookable->contractor->toArray();
                foreach ($contractorData as $key => $value) {
                    $bookable->setAttribute($key, $value);
                }
            }
            $bookable->unsetRelation('contractor');
        }

        if ($bookable->bookable_type === BookableType::PRODUCT) {
            $bookable->load('product');
            if ($bookable->product) {
                $productData = $bookable->product->toArray();
                foreach ($productData as $key => $value) {
                    $bookable->setAttribute($key, $value);
                }
            }
            $bookable->unsetRelation('product');
        }

        if ($bookable->bookable_type === BookableType::ROOM) {
            $bookable->load('room');
            if ($bookable->room) {
                $roomData = $bookable->room->toArray();
                foreach ($roomData as $key => $value) {
                    $bookable->setAttribute($key, $value);
                }
            }
            $bookable->unsetRelation('room');
        }
        return Inertia::render('Bookables/Edit', [
            'bookable' => $bookable,
            'availability' => $availability->toArray(),
            'productCategories' => ProductCategory::all(),
            'contractorRoles' => ContractorRole::all(),
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Bookable $bookable)
    {
        // Validate base fields
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'bookable_type' => ['required', Rule::in(BookableType::values())],
        ]);

        // Validate type-specific fields, similar to store
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            $request->validate([
                'role_id' => 'required|exists:contractor_roles,id',
                'phone_number' => 'required|string|max:255',
                'email' => 'required|string|email|max:255',
            ]);

            // If it's a contractor and the description was updated, update the role's description
            if ($request->has('description')) {
                // Update the role description
                $role = ContractorRole::find($request->role_id);
                if ($role) {
                    $role->description = $request->description;
                    $role->save();
                }
            }
        }



        if ($bookable->bookable_type === BookableType::PRODUCT) {
            $request->validate([
                'brand' => 'required|string|max:255',
                'serial_number' => 'required|string|max:255',
                'category_id' => 'required|exists:product_categories,id',
            ]);
        }
        if ($bookable->bookable_type === BookableType::ROOM) {
            $request->validate([
                'capacity' => 'required|integer|min:1',
            ]);
        }


        // Update base bookable
        $bookable->update($validated);

        // Update type-specific details using updateOrCreate
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            $bookable->contractor()->updateOrCreate(
                ['bookable_id' => $bookable->id],
                [
                    'name' => $request->name,
                    'role_id' => $request->role_id,
                    'phone_number' => $request->phone_number,
                    'email' => $request->email,
                ]
            );
            Cache::forget('contractors');
        }

        if ($bookable->bookable_type === BookableType::PRODUCT) {
            $bookable->product()->updateOrCreate(
                ['bookable_id' => $bookable->id],
                [
                    'name' => $request->name,
                    'serial_number' => $request->serial_number,
                    'brand' => $request->brand,
                    'product_category_id' => $request->category_id,
                    'description' => $request->description,
                ]
            );
            Cache::forget('products');
        }

        if ($bookable->bookable_type === BookableType::ROOM) {
            $bookable->room()->updateOrCreate(
                ['bookable_id' => $bookable->id],
                [
                    'name' => $request->name,
                    'description' => $request->description,
                    'capacity' => $request->capacity,
                ]
            );
            Cache::forget('rooms');
        }

        // Delete all existing availability slots
        $bookable->availability()->delete();

        // Re-create availability slots, following the same structure as in store
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

        return redirect()->route('bookables.index', ['tab' => $bookable->bookable_type->value . 's'])
            ->with('success', 'Bookable updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Bookable $bookable)
    {
        // Determine which cache to invalidate based on bookable type
        if ($bookable->bookable_type === BookableType::CONTRACTOR) {
            Cache::forget('contractors');
        } else if ($bookable->bookable_type === BookableType::PRODUCT) {
            Cache::forget('products');
        } else if ($bookable->bookable_type === BookableType::ROOM) {
            Cache::forget('rooms');
        }

        // Also clear orders cache since orders might reference this bookable
        $this->invalidateOrdersCache();

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
                'start_time' => $order->start_time,
                'end_time' => $order->end_time,
            ]);

        Log::info($bookedSlots);
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
                $conflict = $bookedSlots->contains(function ($booked) use ($slotStart, $slotEnd, $date) {
                    // Convert booked times to Carbon instances
                    $bookedStart = Carbon::parse($booked['start_time']);
                    $bookedEnd = Carbon::parse($booked['end_time']);
                    // Convert the slot times (assuming $slotStart and $slotEnd are strings in H:i format on $date)
                    $slotStartCarbon = Carbon::parse($date . ' ' . $slotStart);
                    $slotEndCarbon = Carbon::parse($date . ' ' . $slotEnd);

                    return $slotStartCarbon->lt($bookedEnd) && $slotEndCarbon->gt($bookedStart);
                });


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
            'available_slots' => $availableSlots,
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

        // Create Carbon instances for the selected timeslot by combining with the date.
        $selectedStart = Carbon::parse($date . ' ' . $selectedStartTime);
        $selectedEnd = Carbon::parse($date . ' ' . $selectedEndTime);

        // Fetch all bookables that are NOT rooms and eager-load necessary relationships
        $availableBookables = Bookable::with(['room', 'contractor.role', 'product'])
            ->where('bookable_type', '!=', 'room')
            ->get();

        // Fetch existing bookings for all non-room bookables on the requested date
        $bookedBookables = OrderBookable::whereDate('start_time', $date)
            ->get()
            ->groupBy('bookable_id'); // Group by bookable ID for faster lookup

        Log::info($bookedBookables);
        Log::info('Selected timeslot: ' . $selectedStart->toDateTimeString() . ' - ' . $selectedEnd->toDateTimeString());

        // Filter only bookables that are not booked for the selected timeslot
        $matchingBookables = $availableBookables->filter(function ($bookable) use ($bookedBookables, $selectedStart, $selectedEnd) {
            if ($bookedBookables->has($bookable->id)) {
                $existingBookings = $bookedBookables->get($bookable->id);
                Log::info('Existing bookings for ' . $bookable->id);
                foreach ($existingBookings as $booking) {
                    $bookingStart = Carbon::parse($booking->start_time);
                    $bookingEnd = Carbon::parse($booking->end_time);

                    // Check for overlap using Carbon's comparison methods
                    if ($selectedStart->lte($bookingEnd) && $selectedEnd->gte($bookingStart)) {
                        return false; // Conflict found, bookable is already taken
                    }
                }
            }

            return true; // Bookable is available for the selected timeslot
        });

        // First, group the matching bookables by type
        $groupedBookables = $matchingBookables->groupBy('bookable_type');

        // Map each contractor to a simpler array structure.
        // Here we extract role_id and role_name separately.
        if ($groupedBookables->has('contractor')) {
            $contractors = collect($groupedBookables['contractor'])->map(function ($contractor) {
                return [
                    'id' => $contractor->id,
                    'role_id' => $contractor->contractor->role->id,
                    'role_name' => $contractor->contractor->role->name,
                    'role_rate' => $contractor->contractor->role->rate,
                    'role_description' => $contractor->contractor->role->description,
                    'email' => $contractor->contractor->email,
                ];
            });

            // Group by role_id (a scalar value) and add a quantity for each group.
            $groupedBookables['contractor'] = $contractors->groupBy('role_id')
                ->map(function ($group, $roleId) {
                    $first = $group->first();
                    return [
                        'role' => $roleId,
                        'role_name' => $first['role_name'] ?? null,
                        'role_description' => $first['role_description'] ?? null,
                        'quantity' => $group->count(),
                        'rate' => $first['role_rate'] ?? null,
                        'contractors' => $group->pluck('email'),
                    ];
                })
                ->values();
        }

        return response()->json([
            'date' => $date,
            'selected_timeslot' => [
                'start_time' => $selectedStart->toTimeString(),
                'end_time' => $selectedEnd->toTimeString(),
            ],
            'available_bookables' => $groupedBookables,
        ]);
    }
}
