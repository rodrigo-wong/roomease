import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-100 to-gray-200 px-4">
            {/* Header Section */}
            <div className="mb-6 flex flex-col items-center">
                <ApplicationLogo className="h-14 w-14" />
                <h1 className="mt-2 text-2xl font-semibold text-gray-700">
                    Book Your Space
                </h1>
                <p className="text-gray-500">Find the perfect room for your needs</p>
            </div>

            {/* Booking Card */}
            <div className="w-full max-w-3xl bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6">{children}</div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-gray-500 text-sm">
                <p>
                    Need Help? <Link href="/contact" className="text-blue-500 hover:underline">Contact Us</Link>
                </p>
            </div>
        </div>
    );
}
