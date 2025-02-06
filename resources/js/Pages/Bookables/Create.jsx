import React, { useEffect } from "react";
import { Link, useForm } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductCategories from "./Categories/Product";
import ContractorRoles from "./Categories/ContractorRoles";
import { use } from "react";

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
        availability: daysOfWeek.reduce((acc, day) => {
            acc[day.id] = [{ start_time: "09:00", end_time: "17:00" }];
            return acc;
        }, {}),
    });

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
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Create Bookable</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bookable Type */}
                    <div>
                        <label className="block font-medium">
                            Bookable Type
                        </label>
                        <select
                            className="w-full p-2 border rounded"
                            value={data.bookable_type}
                            onChange={(e) =>
                                setData("bookable_type", e.target.value)
                            }
                        >
                            <option value="product">Product</option>
                            <option value="room">Room</option>
                            <option value="contractor">Contractor</option>
                        </select>
                    </div>

                    {/* Product Fields (Only Show if Type is Product) */}
                    {data.bookable_type === "product" && (
                        <>
                            {/* Category */}
                            <div className="w-1/5">
                                <label className="block font-medium">
                                    Category
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full p-2 border rounded"
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
                                        {productCategories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>{" "}
                                    <ProductCategories className="w-1/5" />
                                    {errors.category_id && (
                                        <p className="text-red-500 text-sm">
                                            {errors.category_id}
                                        </p>
                                    )}{" "}
                                </div>
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block font-medium">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={data.brand}
                                    onChange={(e) =>
                                        setData("brand", e.target.value)
                                    }
                                    required
                                />
                                {errors.brand && (
                                    <p className="text-red-500 text-sm">
                                        {errors.brand}
                                    </p>
                                )}
                            </div>

                            {/* Serial Number */}
                            <div>
                                <label className="block font-medium">
                                    Serial Number
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={data.serial_number}
                                    onChange={(e) =>
                                        setData("serial_number", e.target.value)
                                    }
                                    required
                                />
                                {errors.serial_number && (
                                    <p className="text-red-500 text-sm">
                                        {errors.serial_number}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
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
                        {errors.name && (
                            <p className="text-red-500 text-sm">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    {/* Contractor Fields (Only Show if Type is Contractor) */}
                    {data.bookable_type === "contractor" && (
                        <>
                            <div className="w-1/5">
                                <label className="block font-medium">
                                    Role
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full p-2 border rounded"
                                        value={data.role_id}
                                        onChange={(e) => {
                                            setData("role_id", e.target.value);
                                        }}
                                        required
                                    >
                                        <option value="">Select a Role</option>
                                        {contractorRoles.map((role) => (
                                            <option
                                                key={role.id}
                                                value={role.id}
                                            >
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ContractorRoles className="w-1/5" />
                                    {errors.role_id && (
                                        <p className="text-red-500 text-sm">
                                            {errors.role_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
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
                                    required
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone Number */}
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
                                    required
                                />
                                {errors.phone_number && (
                                    <p className="text-red-500 text-sm">
                                        {errors.phone_number}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Room Fields (Only Show if Type is Room) */}
                    {data.bookable_type === "room" && (
                        <>
                            <div>
                                <label className="block font-medium">
                                    Capacity
                                </label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={data.capacity}
                                    onChange={(e) =>
                                        setData("capacity", e.target.value)
                                    }
                                    required
                                />
                                {errors.capacity && (
                                    <p className="text-red-500 text-sm">
                                        {errors.capacity}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Rate */}
                    <div>
                        <label className="block font-medium">Rate</label>
                        <input
                            disabled={data.bookable_type === "contractor"}
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
                                            {data.availability[day.id].map(
                                                (slot, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-2 mb-2"
                                                    >
                                                        <input
                                                            type="time"
                                                            value={
                                                                slot.start_time
                                                            }
                                                            onChange={(e) =>
                                                                updateTimeSlot(
                                                                    day.id,
                                                                    index,
                                                                    "start_time",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className="border p-2 rounded"
                                                            required
                                                        />
                                                        <span>to</span>
                                                        <input
                                                            type="time"
                                                            value={
                                                                slot.end_time
                                                            }
                                                            onChange={(e) =>
                                                                updateTimeSlot(
                                                                    day.id,
                                                                    index,
                                                                    "end_time",
                                                                    e.target
                                                                        .value
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
                                                )
                                            )}
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
                            {processing ? "Saving..." : "Create"}
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

export default BookablesCreate;
