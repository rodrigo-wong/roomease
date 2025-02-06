import React from "react";
import { router } from "@inertiajs/react";

const contractorTable = ({ contractors }) => {
    console.log(contractors);
    // Function to handle delete
    const handleDelete = (id, e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to delete this bookable?")) {
            router.delete(route("bookables.destroy", id), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    console.log("Deleted successfully!");
                },
            });
        }
    };
    return (
        <div>
            <table className="table-auto w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Phone</th>
                        <th className="px-4 py-2">Rate</th>
                        <th className="px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {contractors.map((bookable) => (
                        <tr key={bookable.id}>
                            <td className="border px-4 py-2">
                                {bookable.contractor.role.name}
                            </td>
                            <td className="border px-4 py-2">
                                {bookable.contractor.role.description}
                            </td>
                            <td className="border px-4 py-2">{bookable.contractor.name}</td>
                            <td className="border px-4 py-2">
                                {bookable.contractor.email}
                            </td>
                            <td className="border px-4 py-2">
                                {bookable.contractor.phone_number}
                            </td>
                            <td className="border px-4 py-2">
                                {bookable.rate}
                            </td>
                            <td className="border p-2 space-x-2">
                                <button
                                    onClick={(e) =>
                                        router.get(
                                            route("bookables.edit", bookable.id)
                                        )
                                    }
                                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={(e) =>
                                        handleDelete(bookable.id, e)
                                    }
                                    className="px-3 py-1 bg-red-500 text-white rounded"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default contractorTable;
