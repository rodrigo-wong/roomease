import React from "react";

const ReservationReviewTable = ({ bookingItems, hours, totalAmount }) => {
    return (
        <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Item</th>
                    <th className="border p-2 text-left">Rate</th>
                    <th className="border p-2 text-left">Hours</th>
                    <th className="border p-2 text-left">Quantity</th>
                    <th className="border p-2 text-left">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {bookingItems.map((bookable, index) => (
                    <tr key={index}>
                        <td className="border p-2">
                            {bookable.is_room_group
                                ? bookable.display_name
                                : bookable.room?.name ||
                                  bookable.product?.name ||
                                  bookable.role_name}
                        </td>
                        <td className="border p-2">${bookable.rate}</td>
                        <td className="border p-2">{hours}</td>
                        <td className="border p-2">{bookable.quantity || 1}</td>
                        <td className="border p-2">
                            ${bookable.rate * hours * (bookable.quantity || 1)}
                        </td>
                    </tr>
                ))}
                <tr className="font-bold">
                    <td className="border p-2" colSpan="4">
                        Total
                    </td>
                    <td className="border p-2">${totalAmount}</td>
                </tr>
            </tbody>
        </table>
    );
};

export default ReservationReviewTable;
