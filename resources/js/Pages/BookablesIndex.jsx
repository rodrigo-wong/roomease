import React from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link } from "@inertiajs/inertia-react";

const BookablesIndex = ({ products, rooms, contractors }) => {
    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this bookable?")) {
            Inertia.delete(route("bookables.destroy", id));
        }
    };

    return (
        <>
            <div className="p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Bookables</h2>

                {/* Tabs for Products, Rooms, and Contractors */}
                <div className="flex space-x-4 mb-4">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded">
                        Products
                    </button>
                    <button className="px-4 py-2 bg-green-500 text-white rounded">
                        Rooms
                    </button>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded">
                        Contractors
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">ID</th>
                                <th className="border p-2">Name</th>
                                <th className="border p-2">Rate</th>
                                <th className="border p-2">Type</th>
                                <th className="border p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...products, ...rooms, ...contractors].map(
                                (bookable) => (
                                    <tr key={bookable.id} className="border-t">
                                        <td className="border p-2">
                                            {bookable.id}
                                        </td>
                                        <td className="border p-2">
                                            {bookable.name}
                                        </td>
                                        <td className="border p-2">
                                            {bookable.rate}
                                        </td>
                                        <td className="border p-2">
                                            {bookable.bookable_type}
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
                                            <button
                                                onClick={() =>
                                                    handleDelete(bookable.id)
                                                }
                                                className="px-3 py-1 bg-red-500 text-white rounded"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default BookablesIndex;
