import GuestLayout from "@/Layouts/GuestLayout";
import React from "react";

const Confirmed = ({ details }) => {
  const items = details.items;
  const order = details.order;

  // Calculate grand total.
  // Here we assume each item's total = rate * quantity * order.hours.
  const grandTotal = items.reduce((acc, item) => {
    const itemTotal = parseFloat(item.rate) * order.hours * item.quantity;
    return acc + itemTotal;
  }, 0);

  return (
    <GuestLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Order Confirmation</h1>
        
        {/* Order Details */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Order Details</h2>
          <p>
            <strong>Order ID:</strong> {order.id}
          </p>
          <p>
            <strong>Total Amount:</strong> ${order.total_amount}
          </p>
          <p>
            <strong>Booked For:</strong> {new Date(order.start_time).toLocaleString()}
          </p>
          <p>
            <strong>Hours:</strong> {order.hours}
          </p>

          {/* Customer Details */}
          {order.customer && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Your Information</h3>
              <p>
                <strong>Name:</strong> {order.customer.first_name} {order.customer.last_name}
              </p>
              <p>
                <strong>Email:</strong> {order.customer.email}
              </p>
              <p>
                <strong>Phone:</strong> {order.customer.phone_number}
              </p>
            </div>
          )}
        </section>

        {/* Order Items */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Items</h2>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Name</th>
                <th className="border p-2">Description</th>
                <th className="border p-2">Rate</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Hours</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => {
                  const itemTotal = parseFloat(item.rate) * order.hours * item.quantity;
                  return (
                    <tr key={index}>
                      <td className="border p-2">{item.name}</td>
                      <td className="border p-2">{item.description}</td>
                      <td className="border p-2">${item.rate}</td>
                      <td className="border p-2">{item.quantity}</td>
                      <td className="border p-2">{order.hours}</td>
                      <td className="border p-2">${itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="border p-2 text-center" colSpan="6">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="border p-2 text-right font-bold" colSpan="5">Grand Total:</td>
                <td className="border p-2 font-bold">${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>
    </GuestLayout>
  );
};

export default Confirmed;
