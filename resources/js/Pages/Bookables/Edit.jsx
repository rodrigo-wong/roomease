import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link, useForm } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const BookablesEdit = ({ bookable }) => {
    console.log(bookable);
    const { data, setData, put, processing, errors } = useForm({
        name: bookable.name,
        rate: bookable.rate,
        description: bookable.description || "",
        bookable_type: bookable.bookable_type,
        email: bookable.contractor.email || "",
        phone_number: bookable.contractor.phone_number || "",
        role: bookable.contractor.role || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("bookables.update", bookable.id));
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Edit Bookable</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Bookable Type (Disabled) */}
                    <div>
                        <label className="block font-medium">Bookable Type</label>
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
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>

                    {/* Contractor Fields (Only Show if Type is Contractor) */}
                    {data.bookable_type === "contractor" && (
                        <>
                            {/* Email */}
                            <div>
                                <label className="block font-medium">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block font-medium">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full p-2 border rounded"
                                    value={data.phone_number}
                                    onChange={(e) => setData("phone_number", e.target.value)}
                                    required
                                />
                                {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block font-medium">Role</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded"
                                    value={data.role}
                                    onChange={(e) => setData("role", e.target.value)}
                                    required
                                />
                                {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
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
                        {errors.rate && <p className="text-red-500 text-sm">{errors.rate}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-medium">Description</label>
                        <textarea
                            className="w-full p-2 border rounded"
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                        />
                        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
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
                        <Link href={route("bookables.index")} className="px-4 py-2 bg-gray-500 text-white rounded">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesEdit;
