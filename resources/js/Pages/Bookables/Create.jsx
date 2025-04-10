import React, { useEffect } from "react";
import { useState } from "react";
import { Link, useForm } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductCategories from "./Categories/Product";
import ContractorRoles from "./Categories/ContractorRoles";
import { Head } from "@inertiajs/react";

const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
];

const BookablesCreate = ({ productCategories, contractorRoles }) => {
    const findContractorRate = (id) => {
        const role = contractorRoles.find((role) => role.id == id);
        return role ? role.rate : 0;
    };

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        category_id: "",
        role_id: "",
        capacity: 0,
        serial_number: "",
        rate: "",
        description: "",
        bookable_type: "product", // Default type
        email: "",
        phone_number: "",
        is_room_group: false,
        room_ids: [],
        availability: daysOfWeek.reduce((acc, day) => {
            acc[day.id] = [{ start_time: "09:00", end_time: "17:00" }];
            return acc;
        }, {}),
    });

    const [availableRooms, setAvailableRooms] = useState([]);
    // Load available rooms if the bookable type is room and it's a room group - to be used when creating a room group
    useEffect(() => {
        if (data.bookable_type === "room" && data.is_room_group) {
            axios
                .get(route("bookables.available-rooms"))
                .then((response) => {
                    setAvailableRooms(response.data);
                })
                .catch((error) => {
                    console.error("Error loading available rooms:", error);
                });
        }
    }, [data.bookable_type, data.is_room_group]);

    const handleRoomSelection = (roomId) => {
        if (data.room_ids.includes(roomId)) {
            setData(
                "room_ids",
                data.room_ids.filter((id) => id !== roomId)
            );
        } else {
            setData("room_ids", [...data.room_ids, roomId]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("bookables.store"));
    };

    const addTimeSlot = (dayId) => {
        setData("availability", {
            ...data.availability,
            [dayId]: [
                ...data.availability[dayId],
                { start_time: "", end_time: "" },
            ],
        });
    };

    const removeTimeSlot = (dayId, index) => {
        setData("availability", {
            ...data.availability,
            [dayId]: data.availability[dayId].filter((_, i) => i !== index),
        });
    };

    const updateTimeSlot = (dayId, index, field, value) => {
        const updatedSlots = [...data.availability[dayId]];
        updatedSlots[index][field] = value;
        setData("availability", {
            ...data.availability,
            [dayId]: updatedSlots,
        });
    };

    useEffect(() => {
        if (data.bookable_type === "contractor") {
            setData("rate", findContractorRate(data.role_id));
        }
    }, [data.role_id]);

    return (
        <AuthenticatedLayout>
            <Head title="Create Bookable" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Bookable Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bookable Type
                                    </label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={data.bookable_type}
                                        onChange={(e) =>
                                            setData(
                                                "bookable_type",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="product">Product</option>
                                        <option value="room">Room</option>
                                        <option value="contractor">
                                            Contractor
                                        </option>
                                    </select>
                                </div>

                                {/* Room Group Checkbox - Only show if Type is Room */}
                                {data.bookable_type === "room" && (
                                    <div className="mb-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={data.is_room_group}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_room_group",
                                                        e.target.checked
                                                    )
                                                }
                                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">
                                                Create a Room Group
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {/* Name */}

                                {!(
                                    data.bookable_type === "room" &&
                                    data.is_room_group
                                ) && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Name
                                        </label>
                                        <input
                                            required
                                            placeholder="Enter a name here..."
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Product Fields (Only Show if Type is Product) */}
                                {data.bookable_type === "product" && (
                                    <>
                                        {/* Category */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Category
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-w-[200px]"
                                                    value={data.category_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            "category_id",
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option value="">
                                                        Select a Category
                                                    </option>
                                                    {productCategories.map(
                                                        (category) => (
                                                            <option
                                                                key={
                                                                    category.id
                                                                }
                                                                value={
                                                                    category.id
                                                                }
                                                            >
                                                                {category.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <ProductCategories />
                                            </div>
                                            {errors.category_id && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.category_id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Brand
                                            </label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.brand}
                                                onChange={(e) =>
                                                    setData(
                                                        "brand",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {errors.brand && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.brand}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Serial Number
                                            </label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.serial_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "serial_number",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {errors.serial_number && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.serial_number}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Contractor Fields (Only Show if Type is Contractor) */}
                                {data.bookable_type === "contractor" && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Role
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 min-w-[200px]"
                                                    value={data.role_id}
                                                    onChange={(e) => {
                                                        setData(
                                                            "role_id",
                                                            e.target.value
                                                        );
                                                    }}
                                                    required
                                                >
                                                    <option value="">
                                                        Select a Role
                                                    </option>
                                                    {contractorRoles.map(
                                                        (role) => (
                                                            <option
                                                                key={role.id}
                                                                value={role.id}
                                                            >
                                                                {role.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <ContractorRoles />
                                                {errors.role_id && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.role_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.phone_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "phone_number",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                            {errors.phone_number && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.phone_number}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Room Fields (Only Show if Type is Room) */}
                                {data.bookable_type === "room" && (
                                    <>
                                        {/* Room Selector if it's a room group */}
                                        {data.is_room_group ? (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Rooms for this Group
                                                </label>
                                                {availableRooms.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                                        {availableRooms.map(
                                                            (room) => (
                                                                <div
                                                                    key={
                                                                        room.id
                                                                    }
                                                                    className={`border p-3 rounded cursor-pointer transition-colors ${
                                                                        data.room_ids.includes(
                                                                            room.id
                                                                        )
                                                                            ? "border-indigo-500 bg-indigo-50"
                                                                            : "border-gray-300"
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleRoomSelection(
                                                                            room.id
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={data.room_ids.includes(
                                                                                room.id
                                                                            )}
                                                                            onChange={() =>
                                                                                handleRoomSelection(
                                                                                    room.id
                                                                                )
                                                                            }
                                                                            className="rounded border-gray-300 text-indigo-600"
                                                                        />
                                                                        <span className="ml-2 font-medium">
                                                                            {
                                                                                room
                                                                                    .room
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 mt-1 ml-6">
                                                                        Capacity:{" "}
                                                                        {
                                                                            room
                                                                                .room
                                                                                .capacity
                                                                        }
                                                                    </p>
                                                                    <p className="text-sm font-bold text-gray-700 mt-1 ml-6">
                                                                        $
                                                                        {
                                                                            room.rate
                                                                        }
                                                                        /hour
                                                                    </p>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500">
                                                        No individual rooms
                                                        available to add to this
                                                        group.
                                                    </p>
                                                )}
                                                {errors.room_ids && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.room_ids}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            // Show capacity field only if not a room group
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Capacity
                                                </label>
                                                <input
                                                    type="text"
                                                    pattern="[0-9]*"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={data.capacity}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value.replace(
                                                                /[^0-9]/g,
                                                                ""
                                                            );
                                                        setData(
                                                            "capacity",
                                                            value
                                                        );
                                                    }}
                                                    required={
                                                        !data.is_room_group
                                                    }
                                                />
                                                {errors.capacity && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.capacity}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Rate */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Rate
                                    </label>
                                    <input
                                        disabled={
                                            data.bookable_type === "contractor"
                                        }
                                        type="number"
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                            data.bookable_type === "contractor"
                                                ? "bg-gray-100"
                                                : ""
                                        }`}
                                        value={data.rate}
                                        onChange={(e) =>
                                            setData("rate", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.rate && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.rate}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                {!(
                                    data.bookable_type === "room" &&
                                    data.is_room_group
                                ) && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {data.bookable_type === "contractor"
                                                ? "Role Description"
                                                : "Description"}
                                        </label>
                                        <textarea
                                            placeholder="Enter a description here..."
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    "description",
                                                    e.target.value
                                                )
                                            }
                                            rows="4"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Availability Table */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium mb-3">
                                        Availability
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Day
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Time Slots
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {daysOfWeek.map((day) => (
                                                    <tr
                                                        key={day.id}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {day.name}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {data.availability[
                                                                day.id
                                                            ].map(
                                                                (
                                                                    slot,
                                                                    index
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="flex items-center space-x-2 mb-2"
                                                                    >
                                                                        <input
                                                                            type="time"
                                                                            value={
                                                                                slot.start_time
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateTimeSlot(
                                                                                    day.id,
                                                                                    index,
                                                                                    "start_time",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                            required
                                                                        />
                                                                        <span>
                                                                            to
                                                                        </span>
                                                                        <input
                                                                            type="time"
                                                                            value={
                                                                                slot.end_time
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                updateTimeSlot(
                                                                                    day.id,
                                                                                    index,
                                                                                    "end_time",
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                                            required
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeTimeSlot(
                                                                                    day.id,
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="ml-1 text-red-600 hover:text-red-900 focus:outline-none"
                                                                            title="Remove time slot"
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                className="h-5 w-5"
                                                                                viewBox="0 0 20 20"
                                                                                fill="currentColor"
                                                                            >
                                                                                <path
                                                                                    fillRule="evenodd"
                                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                                                                                    clipRule="evenodd"
                                                                                />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    addTimeSlot(
                                                                        day.id
                                                                    )
                                                                }
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4 mr-1"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                                Add Slot
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Submit and Cancel Buttons */}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <Link
                                        href={route("bookables.index")}
                                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        disabled={processing}
                                    >
                                        {processing ? "Creating..." : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesCreate;
