import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminIndex({ users, isSuperAdmin }) {
    const [processing, setProcessing] = useState(false);

    const revokeAccess = (userId) => {
        if (confirm('Are you sure you want to revoke this admin\'s access? This action cannot be undone.')) {
            setProcessing(true);
            router.delete(route('admin.users.destroy', userId), {
                onSuccess: () => {
                    toast.success('Admin access revoked successfully');
                },
                onError: () => {
                    toast.error('Failed to revoke access');
                },
                onFinish: () => setProcessing(false)
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Users
                </h2>
            }
        >
            <Head title="Admin Users" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {users.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                {isSuperAdmin && (
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${user.role === 'super_admin' 
                                                                ? "bg-purple-100 text-purple-800" 
                                                                : "bg-blue-100 text-blue-800"}`}>
                                                            {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                    {isSuperAdmin && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {/* Don't show revoke for super admin or current user */}
                                                            {user.role !== 'super_admin' && !user.is_current_user && (
                                                                <button
                                                                    onClick={() => revokeAccess(user.id)}
                                                                    disabled={processing}
                                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                                >
                                                                    Revoke Access
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No admin users found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}