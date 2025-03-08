import React, { useState, } from "react";
import { router } from "@inertiajs/react";
import { Link, usePage } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductTable from "./Partials/ProductTable";
import ContractorTable from "./Partials/ContractorTable";
import RoomTable from "./Partials/RoomTable";
import { Head } from "@inertiajs/react";

const BookablesIndex = ({ products, rooms, contractors }) => {
    // State to track active tab
    const [activeTab, setActiveTab] = useState("products");
  
    
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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Bookables
                </h2>
            }
        >
            <Head title="Bookables" />
            
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {/* Header with Create Button */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium">Manage Bookables</h3>
                                <Link
                                    href={route("bookables.create")}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Create Bookable
                                </Link>
                            </div>

                            {/* Tabs for Products, Rooms, and Contractors */}
                            <div className="flex border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => setActiveTab("products")}
                                    className={`py-2 px-4 font-medium text-sm border-b-2 focus:outline-none ${
                                        activeTab === "products"
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab("rooms")}
                                    className={`py-2 px-4 font-medium text-sm border-b-2 focus:outline-none ${
                                        activeTab === "rooms"
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    Rooms
                                </button>
                                <button
                                    onClick={() => setActiveTab("contractors")}
                                    className={`py-2 px-4 font-medium text-sm border-b-2 focus:outline-none ${
                                        activeTab === "contractors"
                                            ? "border-indigo-500 text-indigo-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    Contractors
                                </button>
                            </div>

                            {/* Table */}
                            <div className="mt-4">
                                {activeTab === "products" && (
                                    <ProductTable products={products} />
                                )}
                                {activeTab === "contractors" && (
                                    <ContractorTable contractors={contractors} />
                                )}
                                {activeTab === "rooms" && (
                                    <RoomTable rooms={rooms} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesIndex;