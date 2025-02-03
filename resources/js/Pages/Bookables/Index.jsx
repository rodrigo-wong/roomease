import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link, usePage } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

const BookablesIndex = ({ products, rooms, contractors }) => {
    // State to track active tab
    const [activeTab, setActiveTab] = useState("products");

    // Function to handle delete
    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this bookable?")) {
            Inertia.delete(route("bookables.destroy", id));
        }
    };

    // Function to get the currently active bookables
    const getBookables = () => {
        switch (activeTab) {
            case "products":
                return products;
            case "rooms":
                return rooms;
            case "contractors":
                return contractors;
            default:
                return [];
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6 bg-white rounded-lg shadow">
                {/* Header with Create Button */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Bookables</h2>
                    <Link
                        href={route("bookables.create")}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        + Create Bookable
                    </Link>
                </div>

                {/* Tabs for Products, Rooms, and Contractors */}
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`px-4 py-2 rounded ${
                            activeTab === "products"
                                ? "bg-blue-700 text-white"
                                : "bg-blue-500 text-white"
                        }`}
                    >
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab("rooms")}
                        className={`px-4 py-2 rounded ${
                            activeTab === "rooms"
                                ? "bg-green-700 text-white"
                                : "bg-green-500 text-white"
                        }`}
                    >
                        Rooms
                    </button>
                    <button
                        onClick={() => setActiveTab("contractors")}
                        className={`px-4 py-2 rounded ${
                            activeTab === "contractors"
                                ? "bg-orange-700 text-white"
                                : "bg-orange-500 text-white"
                        }`}
                    >
                        Contractors
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Description</th>
                                <th className="border p-2">Rate</th>
                                <th className="border p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getBookables().length > 0 ? (
                                getBookables().map((bookable) => (
                                    <tr key={bookable.id} className="border-t">
                                        <td className="border p-2">
                                            {bookable.name}
                                        </td>
                                        <td className="border p-2">
                                            {bookable.description}
                                        </td>
                                        <td className="border p-2">
                                            {bookable.rate}
                                        </td>
                                        <td className="border p-2 space-x-2">
                                            <Link
                                                href={route(
                                                    "bookables.edit",
                                                    bookable.id
                                                )}
                                                className="px-3 py-1 bg-yellow-500 text-white rounded"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href="#"
                                                onClick={(e) =>
                                                    handleDelete(bookable.id, e)
                                                }
                                                className="px-3 py-1 bg-red-500 text-white rounded"
                                            >
                                                Delete
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="border p-4 text-center text-gray-500"
                                    >
                                        No {activeTab} found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesIndex;
