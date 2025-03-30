<?php

namespace App\Http\Controllers;

use App\Models\Room;
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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\BookableAvailability;
use Illuminate\Support\Facades\Cache;
use App\Traits\CacheInvalidationTrait;



class BookableController extends Controller
{
    use CacheInvalidationTrait;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rooms = Bookable::rooms()
            ->with('room')
            ->get()
            ->append(['display_name', 'display_description', 'display_capacity']);

        return Inertia::render('Bookables/Index', [
            'products' => fn() => Bookable::products()->get(),
            'rooms' => $rooms,
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
        Log::info('Request data: ', $request->all());
        $validated = $request->validate([
            // Base validation for all bookables
            'name' => 'nullable|string|max:255',
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
            // Check if this is a room group and validate accordingly
            if ($request->is_room_group) {
                $request->validate([
                    'room_ids' => 'required|array',
                    'room_ids.*' => 'exists:bookables,id',
                ]);
            } else {
                $request->validate([
                    'capacity' => 'required|integer|min:1',
                ]);
            }
        }
        // If it's a room group, set the is_room_group flag and assign room_ids
        if ($request->bookable_type === 'room' && $request->has('is_room_group')) {
            $validated['is_room_group'] = $request->boolean('is_room_group');

            if ($validated['is_room_group'] && $request->has('room_ids')) {
                $validated['room_ids'] = $request->input('room_ids');
            }
        } else {
            // Otherwise, set is_room_group to false and room_ids to null
            $validated['is_room_group'] = false;
            $validated['room_ids'] = null;
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

        // Only create Room model if NOT a room group
        if ($request->bookable_type === 'room') {
            if (!$validated['is_room_group']) {
                $bookable->room()->create([
                    'name' => $request->name,
                    'description' => $request->description,
                    'capacity' => $request->capacity,
                ]);
            }
            Cache::forget('rooms');
        }

        // Save availability slots using the relationship with BookableAvailability
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
     * Get all available time slots for a specific room on a given date.
     */
    public function getAvailableTimesMultiRoom(Request $request)
    {
        $validated = $request->validate([
            'rooms' => 'required|array',
            'rooms.*' => 'exists:bookables,id',
            'date' => 'required|date',
            'hours' => 'required|integer|min:2',
        ]);
        $roomIds = $validated['rooms']; // Array of bookable(type room) IDs
        $date = $validated['date'];
        $hoursDuration = (int)$validated['hours'];

        // Expand room groups to their individual bookable IDs
        $expandedRoomIds = [];
        foreach ($roomIds as $roomId) {
            // Check if it's a room group
            $bookable = Bookable::find($roomId);
            if ($bookable && $bookable->is_room_group && $bookable->room_ids) {
                // Add all IDs from the group
                $expandedRoomIds = array_merge($expandedRoomIds, $bookable->room_ids);
            } else {
                // It's an individual room, just add it to the list
                $expandedRoomIds[] = (int)$roomId;
            }
        }
        // Remove duplicates (in case a room appears in multiple groups)
        $expandedRoomIds = array_unique($expandedRoomIds);

        $availableSlots = [];
        $unavailableRanges = [];

        // Loop through "roomIds" (bookable IDs) to find the corresponding room models
        foreach ($expandedRoomIds as $roomId) {
            $room = Room::where('bookable_id', $roomId)->first();
            if (!$room) {
                continue; // Skip if room not found
            }
            // From the order_bookables table, find and get all existing bookings for the room(s) on the requested date
            $existingBookings = OrderBookable::where('bookable_id', $room->id)
                ->where('bookable_type', Room::class)
                ->whereDate('start_time', $date)
                ->get();
            // Loop through each booking to find the start and end times
            foreach ($existingBookings as $booking) {
                $startTime = Carbon::parse($booking->start_time);
                $endTime = Carbon::parse($booking->end_time);
                // Add this range to unavailable ranges
                $unavailableRanges[] = [
                    'start' => $startTime->format('H:i'),
                    'end' => $endTime->format('H:i'),
                ];
            }
        }
        // Get all bookable rooms to check their availability schedules and cross-check with the unavailable ranges
        $bookables = Bookable::whereIn('id', $roomIds)->get();

        //Get the day of the week for the selected date - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        $dayOfWeek = Carbon::parse($date)->dayOfWeek;

        $availabilityRanges = [];
        // Loop through each bookable room to get its availability
        foreach ($bookables as $bookable) {
            // Get availability (from bookable_availabilities) for each room on the requested day of week
            $availabilities = $bookable->availability()->where('day_of_week', $dayOfWeek)->get();

            $roomAvailability = [];
            // Loop through each availability slot and convert the start and end times to a format suitable for comparison
            foreach ($availabilities as $availability) {
                $startTime = Carbon::parse($availability->start_time)->format('H:i');
                $endTime = Carbon::parse($availability->end_time)->format('H:i');

                // Add this range to available ranges
                $roomAvailability[] = [
                    'start' => $startTime,
                    'end' => $endTime,
                ];
            }
            // Add this room's availability to the collection
            if (!empty($roomAvailability)) {
                $availabilityRanges[] = $roomAvailability;
            }
        }

        // Find overlapping availability periods across all rooms
        $commonAvailability = $this->findCommonAvailabilityRanges($availabilityRanges);

        // For each common availability period, generate time slots
        foreach ($commonAvailability as $range) {
            $rangeStart = Carbon::parse($date . ' ' . $range['start']);
            $rangeEnd = Carbon::parse($date . ' ' . $range['end']);

            // Generate time slots within this range with 30-minute increments
            $slotStart = clone $rangeStart;

            while ($slotStart->addMinutes(30)->lte($rangeEnd)) {
                $slotStart->subMinutes(30); // Reset start time after the check
                $slotEnd = (clone $slotStart)->addHours($hoursDuration);

                // If this slot would end after the available range, stop incrementing
                if ($slotEnd > $rangeEnd) {
                    $slotStart->addMinutes(30); // Move forward 30 minutes
                    continue;
                }

                // Check if this slot overlaps with any unavailable range
                $isAvailable = true;
                foreach ($unavailableRanges as $unavailable) {
                    $unavailableStart = Carbon::parse($date . ' ' . $unavailable['start'])->subMinutes(30); // Subtract 30 minutes buffer
                    $unavailableEnd = Carbon::parse($date . ' ' . $unavailable['end'])->addMinutes(30); // Add 30 minutes buffer

                    if ($slotStart < $unavailableEnd && $slotEnd > $unavailableStart) {
                        $isAvailable = false;
                        break;
                    }
                }

                if ($isAvailable) {
                    $availableSlots[] = [
                        'start_time' => $slotStart->format('H:i'),
                        'end_time' => $slotEnd->format('H:i'),
                    ];
                }

                $slotStart->addMinutes(30); // Move forward 30 minutes
            }
        }
        return response()->json([
            'available_slots' => $availableSlots,
        ]);
    }

    /**
     * Helper function to find common availability periods
     */
    private function findCommonAvailabilityRanges($availabilityRanges)
    {
        // If no availability ranges are provided, return an empty array
        if (empty($availabilityRanges)) {
            return [];
        }

        // If there's only one room, just return its availability directly
        if (count($availabilityRanges) === 1) {
            return $availabilityRanges[0];
        }

        // Start with the first room's availability ranges
        $commonRanges = $availabilityRanges[0];

        // Intersect with each subsequent room's availability
        for ($i = 1; $i < count($availabilityRanges); $i++) {
            $currentRanges = $availabilityRanges[$i];
            $newCommonRanges = [];

            foreach ($commonRanges as $common) {
                foreach ($currentRanges as $current) {
                    // Find intersection
                    $start = max($common['start'], $current['start']);
                    $end = min($common['end'], $current['end']);

                    if ($start < $end) {
                        $newCommonRanges[] = [
                            'start' => $start,
                            'end' => $end,
                        ];
                    }
                }
            }

            $commonRanges = $newCommonRanges;
            if (empty($commonRanges)) {
                return [];
            }
        }

        return $commonRanges;
    }

    /**
     * Get all available bookables (non-rooms) that are free for multiple rooms at a given date and time slot.
     */
    public function getAvailableBookablesAddons(Request $request)
    {
        $request->validate([
            'rooms' => 'required|array',
            'rooms.*' => 'exists:bookables,id',
            'date' => 'required|date_format:Y-m-d',
            'timeslot' => 'required|array',
            'timeslot.start_time' => 'required|date_format:H:i',
            'timeslot.end_time' => 'required|date_format:H:i|after:timeslot.start_time',
        ]);

        $date = $request->date;
        $roomIds = $request->rooms;
        $selectedStartTime = $request->timeslot['start_time'];
        $selectedEndTime = $request->timeslot['end_time'];

        // Create Carbon instances for the selected timeslot
        $selectedStart = Carbon::parse($date . ' ' . $selectedStartTime);
        $selectedEnd = Carbon::parse($date . ' ' . $selectedEndTime);

        // Expand room groups into individual room bookables
        $expandedRoomIds = [];
        foreach ($roomIds as $roomId) {
            $bookable = Bookable::find($roomId);
            if ($bookable && $bookable->is_room_group && !empty($bookable->room_ids)) {
                $expandedRoomIds = array_merge($expandedRoomIds, $bookable->room_ids);
            } else {
                $expandedRoomIds[] = $roomId;
            }
        }
        $expandedRoomIds = array_unique($expandedRoomIds);

        // Get the Room models for display purposes
        $roomModels = Room::whereIn('bookable_id', $expandedRoomIds)->get();

        // Fetch all bookables that are NOT rooms with necessary relationships
        $availableBookables = Bookable::with(['contractor.role', 'product'])
            ->where('bookable_type', '!=', 'room')
            ->get();

        // Fetch existing bookings for the selected date and organize them by bookable_type and bookable_id
        $bookedItems = OrderBookable::whereDate('start_time', $date)->get();

        $bookedMap = [];
        foreach ($bookedItems as $item) {
            $key = $item->bookable_type . '_' . $item->bookable_id;
            if (!isset($bookedMap[$key])) {
                $bookedMap[$key] = [];
            }
            $bookedMap[$key][] = $item;
        }


        // Group all bookables by type
        $groupedBookables = $availableBookables->groupBy('bookable_type');
        $finalBookables = [];

        // HANDLE CONTRACTORS - Check availability based on actual Contractor model
        if ($groupedBookables->has('contractor')) {
            $contractors = collect($groupedBookables['contractor'])->filter(function ($bookable) use ($bookedMap, $selectedStart, $selectedEnd) {
                // Get the actual contractor model
                $contractor = $bookable->contractor;
                if (!$contractor) return false;

                // Check if this contractor is already booked
                $contractorKey = Contractor::class . '_' . $contractor->id;
                if (isset($bookedMap[$contractorKey])) {
                    $existingBookings = $bookedMap[$contractorKey];
                    foreach ($existingBookings as $booking) {
                        $bookingStart = Carbon::parse($booking->start_time);
                        $bookingEnd = Carbon::parse($booking->end_time);

                        // Check for overlap
                        if ($selectedStart->lte($bookingEnd) && $selectedEnd->gte($bookingStart)) {
                            Log::info("Contractor {$contractor->id} is booked during requested time");
                            return false; // Conflict found
                        }
                    }
                }
                return true; // Available
            })->map(function ($bookable) {
                return [
                    'id' => $bookable->id,
                    'role_id' => $bookable->contractor->role->id,
                    'role_name' => $bookable->contractor->role->name,
                    'role_description' => $bookable->contractor->role->description,
                    'rate' => $bookable->rate,
                    'email' => $bookable->contractor->email,
                ];
            });

            // Group by role_id and add a quantity for each group
            $finalBookables['contractor'] = $contractors->groupBy('role_id')
                ->map(function ($group, $roleId) {
                    $first = $group->first();
                    return [
                        'role' => $roleId,
                        'role_name' => $first['role_name'] ?? null,
                        'role_description' => $first['role_description'] ?? null,
                        'quantity' => $group->count(),
                        'rate' => $first['rate'] ?? null,
                        'contractors' => $group->pluck('email'),
                    ];
                })
                ->values();
        }

        // HANDLE PRODUCTS - Check availability based on actual Product model
        if ($groupedBookables->has('product')) {
            $products = collect($groupedBookables['product'])->filter(function ($bookable) use ($bookedMap, $selectedStart, $selectedEnd) {
                // Get the actual product model
                $product = $bookable->product;
                if (!$product) return false;

                // Check if this product is already booked
                $productKey = Product::class . '_' . $product->id;

                if (isset($bookedMap[$productKey])) {
                    $existingBookings = $bookedMap[$productKey];
                    foreach ($existingBookings as $booking) {
                        $bookingStart = Carbon::parse($booking->start_time);
                        $bookingEnd = Carbon::parse($booking->end_time);

                        // Check for overlap
                        if ($selectedStart->lte($bookingEnd) && $selectedEnd->gte($bookingStart)) {
                            Log::info("Product {$product->id} is booked during requested time");
                            return false; // Conflict found
                        }
                    }
                }
                return true; // Available
            })->map(function ($bookable) {
                return [
                    'id' => $bookable->id,
                    'product' => [
                        'id' => $bookable->product->id,
                        'name' => $bookable->product->name,
                        'description' => $bookable->product->description,
                        'serial_number' => $bookable->product->serial_number,
                        'brand' => $bookable->product->brand,
                    ],
                    'rate' => $bookable->rate,
                    'available_quantity' => 1 // Each individual product has quantity=1
                ];
            });

            $finalBookables['product'] = $products->values();
        }

        // Return all available bookables for these rooms
        return response()->json([
            'date' => $date,
            'rooms' => $roomModels->pluck('name'),
            'selected_timeslot' => [
                'start_time' => $selectedStart->format('H:i'),
                'end_time' => $selectedEnd->format('H:i'),
            ],
            'available_bookables' => $finalBookables,
        ]);
    }


    /**
     * Get all individual rooms that can be added to a room group
     */
    public function getAvailableRoomsForGroup()
    {
        $rooms = Bookable::individualRooms()
            ->get()
            ->append(['display_name', 'display_description', 'display_capacity']);

        return response()->json($rooms);
    }

    /**
     * Update only rate and availability for a room group
     */
    public function updateRoomGroup(Request $request, Bookable $bookable)
    {
        // Validate this is actually a room group
        if (!$bookable->is_room_group || $bookable->bookable_type !== BookableType::ROOM) {
            return redirect()->back()
                ->with('error', 'This endpoint is only for updating room groups');
        }

        // Validate only the fields we want to allow updating
        $validated = $request->validate([
            'rate' => 'required|numeric|min:0',
            'availability' => 'required|array',
        ]);

        // Update the rate (and name if provided)
        $bookable->update([
            'rate' => $validated['rate'],
        ]);

        // Update availability
        $bookable->availability()->delete(); // Remove existing availability

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

        // Clear cache to reflect changes
        Cache::forget('rooms');

        return redirect()->route('bookables.index', ['tab' => 'rooms'])
            ->with('success', 'Room group updated successfully!');
    }
}
