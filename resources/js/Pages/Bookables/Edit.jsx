import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link, useForm } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
];

const BookablesEdit = ({ bookable }) => {
    console.log("Bookable received:", bookable);

    const { data, setData, put, processing, errors } = useForm({
        name: bookable.name,
        rate: bookable.rate,
        description: bookable.description || "",
        bookable_type: bookable.bookable_type,
        email: bookable.contractor?.email || "",
        phone_number: bookable.contractor?.phone_number || "",
        role: bookable.contractor?.role || "",
        availability: bookable.availability.reduce((acc, slot) => {
            acc[slot.day_of_week] = acc[slot.day_of_week] || [];
            acc[slot.day_of_week].push({
                start_time: slot.start_time,
                end_time: slot.end_time,
            });
            return acc;
        }, {}),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("bookables.update", bookable.id));
    };

    const addTimeSlot = (dayId) => {
        setData("availability", {
            ...data.availability,
            [dayId]: [
                ...(data.availability[dayId] || []),
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
        const updatedSlots = [...(data.availability[dayId] || [])];
        updatedSlots[index][field] = value;
        setData("availability", {
            ...data.availability,
            [dayId]: updatedSlots,
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Edit Bookable</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bookable Type (Disabled) */}
                    <div>
                        <label className="block font-medium">
                            Bookable Type
                        </label>
                        <select
                            className="w-full p-2 border rounded bg-gray-200 cursor-not-allowed"
                            value={data.bookable_type}
                            disabled
                        >
                            <option value="product">Product</option>
                            <option value="room">Room</option>
                            <option value="contractor">Contractor</option>
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block font-medium">Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                        />
                    </div>

                    {/* Contractor Fields (Only Show if Type is Contractor) */}
                    {data.bookable_type === "contractor" && (
                        <>
                            <div>
                                <label className="block font-medium">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="block font-medium">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    className="w-full p-2 border rounded"
                                    value={data.phone_number}
                                    onChange={(e) =>
                                        setData("phone_number", e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <label className="block font-medium">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={data.role}
                                    onChange={(e) =>
                                        setData("role", e.target.value)
                                    }
                                />
                            </div>
                        </>
                    )}

                    {/* Rate */}
                    <div>
                        <label className="block font-medium">Rate</label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded"
                            value={data.rate}
                            onChange={(e) => setData("rate", e.target.value)}
                            required
                        />
                        {errors.rate && (
                            <p className="text-red-500 text-sm">
                                {errors.rate}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-medium">Description</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    {/* Availability Table */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Availability
                        </h3>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2">Day</th>
                                    <th className="border p-2">Time Slots</th>
                                    <th className="border p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daysOfWeek.map((day) => (
                                    <tr key={day.id}>
                                        <td className="border p-2 font-semibold">
                                            {day.name}
                                        </td>
                                        <td className="border p-2">
                                            {(
                                                data.availability[day.id] || []
                                            ).map((slot, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center space-x-2 mb-2"
                                                >
                                                    <input
                                                        type="time"
                                                        value={slot.start_time}
                                                        onChange={(e) =>
                                                            updateTimeSlot(
                                                                day.id,
                                                                index,
                                                                "start_time",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="border p-2 rounded"
                                                        required
                                                    />
                                                    <span>to</span>
                                                    <input
                                                        type="time"
                                                        value={slot.end_time}
                                                        onChange={(e) =>
                                                            updateTimeSlot(
                                                                day.id,
                                                                index,
                                                                "end_time",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="border p-2 rounded"
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
                                                        className="px-2 py-1 bg-red-500 text-white rounded"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            ))}
                                        </td>
                                        <td className="border p-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addTimeSlot(day.id)
                                                }
                                                className="px-2 py-1 bg-blue-500 text-white rounded"
                                            >
                                                + Add Slot
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Submit and Cancel Buttons */}
                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                            disabled={processing}
                        >
                            {processing ? "Saving..." : "Update"}
                        </button>
                        <Link
                            href={route("bookables.index")}
                            className="px-4 py-2 bg-gray-500 text-white rounded"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesEdit;
