import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import Pagination from '@/Components/Pagination';

export default function Dashboard({ orders, contractors, contractorRoles, rooms, products }) {
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedBookable, setSelectedBookable] = useState(null);

     // Helper function to get the name based on bookable type and ID
     const getItemName = (bookable) => {
        if (bookable.bookable) {
            console.log('bookable has a bookable, this is a contractor line 13');
            if (bookable.bookable_type.includes('ContractorRole')) {
                // The role name is directly available on the bookable.bookable object
                const roleName = bookable.bookable.name || 'Unknown Role';
                
                return (
                    <div>
                        <div className="font-medium">{roleName}</div>
                        <div className="text-xs text-gray-500">
                            {"Status: Awaiting Assignment"}
                        </div>
                    </div>
                );
            }
            
            // Case 2: For Contractor type (confirmed assignment)
            if (bookable.bookable_type.includes('Contractor')) {
                // Here we need to look up the role using the role_id from the contractor
                const role = contractorRoles?.find(r => r.id === bookable.bookable.role_id);
                const roleName = role ? role.name : 'NA';
                
                return (
                    <div>
                        <div className="font-medium">{bookable.bookable.name}</div>
                        <div className="text-xs text-gray-500">
                            {roleName} • {bookable.bookable.email}
                        </div>
                    </div>
                );
            }
            //return bookable.bookable.name || 'Not assigned';
        }
        
        // Add safety checks for each collection
        if (bookable.bookable_type.includes('Room')) {
            console.log('room is here line 34')
            // Make sure rooms is defined before calling find
            if (!rooms) return 'Loading rooms...';
            const room = rooms.find(room => room.bookable_id === bookable.bookable_id);
            return room ? room.name : 'Room not found';
        }
        
        if (bookable.bookable_type.includes('Product')) {
            console.log('product is here line 42')
            // Make sure products is defined before calling find
            if (!products) return 'Loading products...';
            const product = products.find(product => product.bookable_id === bookable.bookable_id);
            return product ? product.name : 'Product not found';
        }

        
        return 'Not assigned';
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        order_id: '',
        order_bookable_id: '',
        contractor_id: '',
    });

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleString();
    };

    const openAssignModal = (order, bookable) => {
        setSelectedBookable(bookable);
        setData({
            order_id: order.id,
            order_bookable_id: bookable.id,
            contractor_id: '',
        });
        setShowAssignModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('orders.assign-contractor'), {
            onSuccess: () => {
                setShowAssignModal(false);
                reset();
            },
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };
    
    const toggleOrderExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };
    
    const getContractorsByRole = (roleId) => {
        return contractors.filter(contractor => contractor.role_id === roleId);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Orders

                </h2>
            }
        >
            <Head title="Order Management" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="mb-4 text-lg font-medium">Orders</h3>
                            
                            {!orders.data || orders.data.length === 0 ? (
                                <p>No orders found.</p>
                                /*TODO:center this no order found text */
                            ) : (
                                <div className="">
                                    <table className="min-w-full divide-y divide-gray-200 overflow-x-auto">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.data && orders.data.map((order) => (
                                                <React.Fragment key={order.id}>
                                                    <tr className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                                  order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                                                  'bg-blue-100 text-blue-800'}`}>
                                                                {order.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {order.customer && `${order.customer.first_name} ${order.customer.last_name}`}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(order.total_amount)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            {/* TODO: make the details show in a new page, too much information in the table 
                                                                TODO: could add a cancel button for pending orders
                                                            */}
                                                            <button
                                                                onClick={() => toggleOrderExpand(order.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedOrder === order.id && (
                                                        <tr>
                                                            <td colSpan="6" className="px-6 py-4">
                                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                                    <h4 className="font-semibold mb-2">Order Details</h4>
                                                                    <table className="min-w-full divide-y divide-gray-200">
                                                                        <thead className="bg-gray-100">
                                                                            <tr>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item Name</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                                            {order.order_bookables.map((bookable) => (
                                                                                <tr key={bookable.id}>
                                                                                    <td className="px-4 py-2">
                                                                                    {bookable.bookable_type.includes('ContractorRole') 
                                                                                                ? 'Contractor' 
                                                                                            : bookable.bookable_type.split('\\').pop()}
                                                                                    </td>
                                                                                    <td className="px-4 py-2">
                                                                                    {getItemName(bookable)}
                                        
                                                                                       {/* {console.log("contractor role: ->",contractorRoles)}
                                                                                       {console.log("contractor->",contractors)}
                                                                                       {console.log("rooms->",rooms)}
                                                                                       {console.log("products->",products)}
                                                                                       {console.log("bookable->",bookable)} */}
                                                                                      
                                                                                       
                                                                                    </td>
                                                                                    <td className="px-4 py-2">
                                                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                                            ${bookable.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                                                            'bg-green-100 text-green-800'}`}>
                                                                                            {bookable.status.toUpperCase()}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2">
                                                                                        {formatDateTime(bookable.start_time)} - {formatDateTime(bookable.end_time)}
                                                                                    </td>
                                                                                    <td className="px-4 py-2">
                                                                                        {bookable.status === 'pending' && 
                                                                                        bookable.bookable_type.includes('ContractorRole') && (
                                                                                            <button
                                                                                                onClick={() => openAssignModal(order, bookable)}
                                                                                                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs"
                                                                                            >
                                                                                                Assign Contractor
                                                                                            </button>
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                  
        <div className="mt-6">
            {orders.links && <Pagination links={orders.links} />}
        </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Assign Contractor Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium mb-4">Assign Contractor</h3>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Contractor
                                </label>
                                
                                <select
                                    value={data.contractor_id}
                                    onChange={(e) => setData('contractor_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">-- Select Contractor --</option>
                                    {selectedBookable && getContractorsByRole(selectedBookable.bookable_id).map((contractor) => (
                                        <option key={contractor.id} value={contractor.id}>
                                            {contractor.name} ({contractor.email})
                                        </option>
                                    ))}
                                </select>
                                
                                {errors.contractor_id && (
                                    <p className="text-red-500 text-xs mt-1">{errors.contractor_id}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Assign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
