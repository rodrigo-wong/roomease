import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function InvitationsIndex({ invitations, isSuperAdmin, auth }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        email: '',
    });

    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.invitations.store'), {
            onSuccess: () => {
                reset('email');
                toast.success('Invitation sent successfully!');
            },
            onError: () => toast.error('Failed to send invitation'),
        });
    };

    const deleteInvitation = (id) => {
        if (confirm('Are you sure you want to delete this invitation?')) {
            router.delete(route('admin.invitations.destroy', id), {
                onStart: () => setDeleteProcessing(true),
                onFinish: () => setDeleteProcessing(false),
            });
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Invitations
                </h2>
            }
        >
            <Head title="Admin Invitations" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {/* Only show invitation form for super admins */}
                            {isSuperAdmin && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4">Send New Admin Invitation</h3>
                                    <form onSubmit={handleSubmit} className="flex items-end gap-4">
                                        <div className="flex-grow">
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="admin@example.com"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
                                        >
                                            {processing ? 'Sending...' : 'Send Invitation'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Active Invitations</h3>
                                
                                {invitations.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Invited By
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Sent At
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Expires At
                                                    </th>
                                                    {isSuperAdmin && (
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invitations.map((invitation) => (
                                                    <tr key={invitation.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {invitation.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {invitation.inviter.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {invitation.accepted_at ? (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    Accepted
                                                                </span>
                                                            ) : new Date(invitation.expires_at) < new Date() ? (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                                    Expired
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                    Pending
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(invitation.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(invitation.expires_at)}
                                                        </td>
                                                        {/* Only show delete option for super admins */}
                                                        {isSuperAdmin && (
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                {!invitation.accepted_at && new Date(invitation.expires_at) > new Date() && (
                                                                    <button
                                                                        onClick={() => deleteInvitation(invitation.id)}
                                                                        disabled={deleteProcessing}
                                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                                    >
                                                                        Delete
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
                                    <p className="text-gray-500 italic">No active invitations found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}