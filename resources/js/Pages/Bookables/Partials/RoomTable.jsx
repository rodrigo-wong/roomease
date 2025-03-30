import React from "react";
import { router } from "@inertiajs/react";
import { useState } from "react";

const RoomTable = ({ rooms }) => {
    // State to track expanded room groups
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroupExpansion = (id) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

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
        <div className="overflow-x-auto">
            {rooms && rooms.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Capacity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rooms.map((bookable) => (
                            <React.Fragment key={bookable.id}>
                                <tr
                                    className={`hover:bg-gray-50 ${
                                        bookable.is_room_group
                                            ? "bg-blue-50"
                                            : ""
                                    }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            {bookable.is_room_group && (
                                                <button
                                                    onClick={() =>
                                                        toggleGroupExpansion(
                                                            bookable.id
                                                        )
                                                    }
                                                    className="mr-2 text-blue-500 focus:outline-none"
                                                >
                                                    {expandedGroups[
                                                        bookable.id
                                                    ] ? (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 15l7-7 7 7"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                            <span>
                                                {bookable.display_name || "-"}
                                                {bookable.is_room_group && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Group
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        {bookable.display_description || "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {bookable.is_room_group ? (
                                            <span
                                                title={`Combined capacity: ${bookable.display_capacity}`}
                                            >
                                                {bookable.display_capacity}
                                            </span>
                                        ) : (
                                            bookable.display_capacity || "-"
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${parseFloat(bookable?.rate).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() =>
                                                    router.get(
                                                        route(
                                                            "bookables.edit",
                                                            bookable.id
                                                        )
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
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) =>
                                                    handleDelete(bookable.id, e)
                                                }
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-4 w-4 mr-1"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Show child rooms when group is expanded */}
                                {bookable.is_room_group &&
                                    expandedGroups[bookable.id] &&
                                    bookable.room_ids?.map((roomId) => {
                                        // Find the child room from all rooms
                                        const childRoom = rooms.find(
                                            (r) => r.id === roomId
                                        );
                                        if (!childRoom) return null;

                                        return (
                                            <tr
                                                key={`group-${bookable.id}-room-${roomId}`}
                                                className="bg-gray-100"
                                            >
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 pl-12">
                                                    {childRoom?.room?.name ||
                                                        "-"}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-700 max-w-xs truncate">
                                                    {childRoom?.room
                                                        ?.description || "-"}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {childRoom?.room
                                                        ?.capacity || "-"}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    $
                                                    {parseFloat(
                                                        childRoom?.rate
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                                                    <span className="text-xs text-gray-500 italic">
                                                        Part of group
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="py-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    No rooms available
                </div>
            )}
        </div>
    );
};

export default RoomTable;
