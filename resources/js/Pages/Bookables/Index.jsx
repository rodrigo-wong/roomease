import React, { useState } from "react";
import { router } from "@inertiajs/react";
import { Link, usePage } from "@inertiajs/inertia-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ProductTable from "./Partials/ProductTable";
import ContractorTable from "./Partials/ContractorTable";

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
                {activeTab === "products" && (
                    <ProductTable products={products} />
                )}
                {activeTab === "contractors" && (
                    <ContractorTable contractors={contractors} />
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default BookablesIndex;
