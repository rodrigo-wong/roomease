import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import Pagination from '@/Components/Pagination';
import { useRef } from 'react';

export default function Dashboard({ orders, contractors, contractorRoles, rooms, products, filters = {}, flash }) {
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedBookable, setSelectedBookable] = useState(null);
    const [timeFilter, setTimeFilter] = useState(filters.timeFilter || 'all'); 
    const [statusFilter, setStatusFilter] = useState(filters.statusFilter || 'all'); 
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
    const { data: adminBookingData, setData: setAdminBookingData, post: postAdminBooking, processing: adminBookingProcessing, errors: adminBookingErrors, reset: resetAdminBookingForm } = useForm({
        room_id: '',
        date: new Date().toISOString().split('T')[0], 
        start_time: '',
        end_time: '',
        note: ''
      });
    const [formValidationErrors, setFormValidationErrors] = useState({});

     // Get name based on bookable type and ID
     const getItemName = (bookable) => {
        if (bookable.bookable) {
   
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
            
            // For Contractor type (confirmed assignment)
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
        }
        
          if (bookable.bookable_type.includes('Room')) {
            if (!rooms) return 'Loading rooms...';
            const room = rooms.find(room => room.id === bookable.bookable_id);
            console.log(rooms);
            console.log(bookable.bookable_id);
            return room ? room.name : 'Room not found';
        }
        
        if (bookable.bookable_type.includes('Product')) {
            if (!products) return 'Loading products...';
            const product = products.find(product => product.id === bookable.bookable_id);
            return product ? product.name : 'Product not found';
        }  
        return 'Not assigned';
    };

    const { data, setData, post, processing, reset, errors } = useForm({
        order_id: '',
        order_bookable_id: '',
        contractor_id: '',
    });


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

    const handleTimeFilterChange = (value) => {
        setTimeFilter(value);
        router.get(route('dashboard'), {
            search: searchTerm,
            timeFilter: value,
            statusFilter: statusFilter
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        router.get(route('dashboard'), {
            search: searchTerm,
            timeFilter: timeFilter,
            statusFilter: value
        }, {
            preserveState: true,
            replace: true
        });
    };

     
        const handleSearchChange = (e) => {
            const value = e.target.value;
            setSearchTerm(value);   
            // Debounce the search input
            clearTimeout(searchDebounce.current);
            searchDebounce.current = setTimeout(() => {
                router.get(route('dashboard'), {
                    search: value,
                    timeFilter: timeFilter,
                    statusFilter: statusFilter
                }, {
                    preserveState: true,
                    replace: true
                });
            }, 300);
        };
        const searchDebounce = useRef(null);


 const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

const getBookingTimeDisplay = (order) => {
    if (!order.order_bookables || order.order_bookables.length === 0) {
        return 'No booking time';
    }
    const bookable = order.order_bookables[0];
    const startTime = new Date(bookable.start_time);
    const endTime = new Date(bookable.end_time);
    
    return `${formatDate(startTime)}, ${formatTime(startTime)} - ${formatTime(endTime)}`;
};

const formatBookableTime = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
    } else {
        return `${formatDate(start)}, ${formatTime(start)} - ${formatDate(end)}, ${formatTime(end)}`;
    }
};

const closeAdminBookingModal = () => {
    setShowAdminBookingModal(false);
    resetAdminBookingForm();
    setFormValidationErrors({});
};


const handleAdminBookingSubmit = (e) => {
    e.preventDefault();
    // Clear previous validation errors
    setFormValidationErrors({});
    //Form validation
    let errors = {};
    let isValid = true;
    if (!adminBookingData.room_id) {
        errors.room_id = "Please select a room";
        isValid = false;
    }
    if (!adminBookingData.start_time) {
        errors.start_time = "Start time is required";
        isValid = false;
    }
    if (!adminBookingData.end_time) {
        errors.end_time = "End time is required";
        isValid = false;
    }
      // Validate that end time is after start time
      if (adminBookingData.start_time && adminBookingData.end_time) {
        const startDateTime = new Date(`${adminBookingData.date}T${adminBookingData.start_time}`);
        const endDateTime = new Date(`${adminBookingData.date}T${adminBookingData.end_time}`);
        if (endDateTime <= startDateTime) {
            errors.end_time = "End time must be after start time";
            isValid = false;
        }
    }
    if (!isValid) {
        setFormValidationErrors(errors);
        return;
    }
    // If validation passes, submit the form
    postAdminBooking(route('orders.admin-booking'), {
        onSuccess: (response) => {
            setShowAdminBookingModal(false);
            resetAdminBookingForm();
        },
        onError: () => {
            console.error('Admin booking failed - Please try again.');
        },
        onFinish: () => {
            console.log('Admin booking finished');
        }
    });
};

const handleInputChange = (field, value) => {
        // Clear the error for this field when user makes changes
        if (formValidationErrors[field]) {
            setFormValidationErrors(prev => {
                const updated = {...prev};
                delete updated[field];
                return updated;
            });
        }
        setAdminBookingData(field, value);
}

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Room Bookings
                </h2>
            }
        >
            <Head title="Order Management" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                       
                        {flash && flash.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
            <span className="block sm:inline">{flash.success}</span>
            <button onClick={() => delete flash.success} className="text-green-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )}

                    
{/* Time, Status Filters and Search Bar */}
<div className="mb-6">
    <div className="flex flex-wrap items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 mb-2 sm:mb-0">
            {/* Time Filter */}
            <div className="flex items-center mr-4">
                <span className="text-sm font-medium text-gray-700 mr-2">Time:</span>
                <button 
                    onClick={() => handleTimeFilterChange('all')}
                    className={`px-3 py-1 text-sm rounded-md ${timeFilter === 'all' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => handleTimeFilterChange('future')}
                    className={`px-3 py-1 text-sm rounded-md ml-1 ${timeFilter === 'future' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    Upcoming & Active
                </button>
                <button 
                    onClick={() => handleTimeFilterChange('past')}
                    className={`px-3 py-1 text-sm rounded-md ml-1 ${timeFilter === 'past' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    Past
                </button>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
                <button 
                    onClick={() => handleStatusFilterChange('all')}
                    className={`px-3 py-1 text-sm rounded-md ${statusFilter === 'all' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    All
                </button>
                <button 
                    onClick={() => handleStatusFilterChange('pending')}
                    className={`px-3 py-1 text-sm rounded-md ml-1 ${statusFilter === 'pending' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    Pending
                </button>
                <button 
                    onClick={() => handleStatusFilterChange('completed')}
                    className={`px-3 py-1 text-sm rounded-md ml-1 ${statusFilter === 'completed' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                    Completed
                </button>
            </div>

            {/* Search Input */}
            <div className="relative w-64">
                <input
                    type="text"
                    placeholder="Search by customer name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-1.5 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>
        
        {/* Create Admin Block Button */}
        <button 
            onClick={() => setShowAdminBookingModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Create Admin Block
        </button>
    </div>
</div>

{/*Orders table*/}
{!orders.data || orders.data.length === 0 ? (
    <p>No room bookings found.</p>
    
) : (
    <div className="">
        <table className="min-w-full divide-y divide-gray-200 overflow-x-auto">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {orders.data.map((order) => (
                    <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">{order.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                order.status === 'admin_reserved' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'}`}>
                                {order.status === 'admin_reserved' ? 'ADMIN BLOCK' : order.status.toUpperCase()}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {order.customer && `${order.customer.first_name} ${order.customer.last_name}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(order.total_amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getBookingTimeDisplay(order)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        
                                <button
                                    onClick={() => toggleOrderExpand(order.id)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                >
                                    {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                                </button>
                            </td>
                        </tr>

                    </React.Fragment>
                ))}
            </tbody>
        </table>

        {/* Pagination Component*/}
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
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

            {/* Booking Details Modal */}
{expandedOrder && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b">
                <h3 className="text-lg font-medium">
                    Order Details: #{expandedOrder}
                </h3>
                <button 
                    onClick={() => setExpandedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                {orders.data && (() => {
                    const order = orders.data.find(o => o.id === expandedOrder);
                    if (!order) return <p>Booking not found</p>;
                    
                    return (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="font-medium">{order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'No customer'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        order.status === 'admin_reserved' ? 'bg-purple-100 text-purple-800' : 
                                        'bg-blue-100 text-blue-800'}`}>
                                        {order.status === 'admin_reserved' ? 'ADMIN BLOCK' : order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Booking Time</p>
                                    <p className="font-medium">{getBookingTimeDisplay(order)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Amount</p>
                                    <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                                </div>
                                {order.notes && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="font-medium">{order.notes}</p>
                                </div>
                                    )}
                            </div>
                            
                            <h4 className="font-semibold mb-2">Booked Items</h4>
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
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${bookable.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-green-100 text-green-800'}`}>
                                                    {bookable.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                {formatBookableTime(bookable.start_time, bookable.end_time)}
                                            </td>
                                            <td className="px-4 py-2">
                                                {bookable.status === 'pending' && 
                                                bookable.bookable_type.includes('ContractorRole') && (
                                                    <button
                                                        onClick={() => {
                                                          
                                                            openAssignModal(order, bookable);
                                                        }}
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
                    );
                })()}
            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setExpandedOrder(null)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Admin Booking Modal */}
{showAdminBookingModal && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Block Room Time</h3>
                <button 
                    onClick={closeAdminBookingModal}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <form onSubmit={handleAdminBookingSubmit} noValidate>
                <div className="space-y-4">
                    {/* Room Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Room to Block
                        </label>
                        <select
                            value={adminBookingData.room_id}
                            onChange={(e) => handleInputChange('room_id', e.target.value)}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                formValidationErrors.room_id || adminBookingErrors.room_id 
                                ? 'border-red-300' 
                                : 'border-gray-300'
                            }`}                           
                            required
                        >
                            <option value="">-- Select Room --</option>
                            {rooms && rooms.map((room) => (
                                <option key={room.bookable_id} value={room.bookable_id}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                        {formValidationErrors.room_id && (
                            <p className="text-red-500 text-xs mt-1">{formValidationErrors.room_id}</p>
                                 )}
                        {adminBookingErrors.room_id && (
                            <p className="text-red-500 text-xs mt-1">{adminBookingErrors.room_id}</p>
                             )}
                    </div>
                    
                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={adminBookingData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                formValidationErrors.date || adminBookingErrors.date
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}                            required
                            min={new Date().toISOString().split('T')[0]} // Can't select past dates
                        />
                     {formValidationErrors.date && (
                        <p className="text-red-500 text-xs mt-1">{formValidationErrors.date}</p>
                        )}
                    {adminBookingErrors.date && (
                        <p className="text-red-500 text-xs mt-1">{adminBookingErrors.date}</p>
                        )}
                    </div>
                    
                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={adminBookingData.start_time}
                                onChange={(e) => handleInputChange('start_time', e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                    formValidationErrors.start_time || adminBookingErrors.start_time
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                                }`}
                                required
                            />
                               {formValidationErrors.start_time && (
                                <p className="text-red-500 text-xs mt-1">{formValidationErrors.start_time}</p>
                            )}
                            {adminBookingErrors.start_time && (
                                <p className="text-red-500 text-xs mt-1">{adminBookingErrors.start_time}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                            </label>
                            <input
                                type="time"
                                value={adminBookingData.end_time}
                                onChange={(e) => handleInputChange('end_time', e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                    formValidationErrors.end_time || adminBookingErrors.end_time
                                    ? 'border-red-300'
                                    : 'border-gray-300'
                                }`}
                                required
                            />
                             {formValidationErrors.end_time && (
                            <p className="text-red-500 text-xs mt-1">{formValidationErrors.end_time}</p>
                        )}
                        {adminBookingErrors.end_time && (
                            <p className="text-red-500 text-xs mt-1">{adminBookingErrors.end_time}</p>
                        )}
                        </div>
                    </div>
                    
                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Blocking (optional)
                        </label>
                        <textarea
                             value={adminBookingData.note}
                             onChange={(e) => handleInputChange('note', e.target.value)}
                             className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                                adminBookingErrors.note
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}                            rows="3"
                            placeholder="e.g., Maintenance, Private Event, etc."
                        ></textarea>
                        {adminBookingErrors.note && (
                            <p className="text-red-500 text-xs mt-1">{adminBookingErrors.note}</p>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={closeAdminBookingModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                    >
                        Block Room
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
        </AuthenticatedLayout>
    );
}
