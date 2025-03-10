import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';  // Import the specific icon

export default function ContractorsLandingPage({ status, message, person }) {
    return (
        <GuestLayout>
            <Head title="Contractors Landing Page" />
            <div style={status == 1 ? { backgroundColor: '#8bc348', padding: '20px', fontSize: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' } : { backgroundColor: '#fed480', padding: '20px', fontSize: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                {status==-1 ? (<FontAwesomeIcon icon={faLock}/>) : 
                (<FontAwesomeIcon icon={faCircleCheck} />)}
                <h1>
                    {message}{status == 1 && ", " + person.name}
                </h1>
            </div>
        </GuestLayout>
    );
}


