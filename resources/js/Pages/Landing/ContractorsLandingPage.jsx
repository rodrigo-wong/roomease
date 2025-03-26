import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCircleCheck } from '@fortawesome/free-solid-svg-icons';  // Import the specific icon

export default function ContractorsLandingPage({ status, message, person }) {
    return (
        <>
            <Head title="Contractors Landing Page" />
            <div
                style={{
                    margin: 0,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)', 
                    msTransform: 'translate(-50%, -50%)', 
                }}
            >
                <div
                    style={
                        status == 1
                            ? {
                                backgroundColor: '#8bc348',
                                paddingLeft: '4em',
                                paddingRight: '4em',
                                paddingTop: '1em',
                                paddingBottom: '1em',
                                fontSize: '25px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                width: '100%',
                                maxWidth: '800px',
                                borderRadius: '20px',
                            }
                            : {
                                backgroundColor: '#fed480',
                                paddingLeft: '4em',
                                paddingRight: '4em',
                                paddingTop: '1em',
                                paddingBottom: '1em',
                                fontSize: '25px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px',
                                borderRadius: '25px',
                                width: '100%',
                                maxWidth: '800px',
                            }
                    }
                >
                    {status == -1 ? (
                        <FontAwesomeIcon icon={faLock} />
                    ) : (
                        <FontAwesomeIcon icon={faCircleCheck} />
                    )}
                    <h1>
                        {message}
                        {status == 1 && `, ${person.name}`}
                    </h1>
                </div>
            </div>

        </>
    );
}


