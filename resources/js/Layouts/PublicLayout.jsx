import { Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
        <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/">
                        <ApplicationLogo className="h-10 w-auto fill-current text-gray-800" />
                    </Link>
                </div>
            </header>
            {/* Main Content */}
            <main className="container mx-auto flex-1 px-4 py-6">
                {children}
            </main>
            {/* Footer */}
            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto px-4 py-4 text-center">
                &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'Room Booking App'}. All rights reserved.
                </div>
            </footer>
        </div>
        
            
    );
}