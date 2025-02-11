import React, { useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import axios from "axios";
import GuestLayout from "@/Layouts/GuestLayout";
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import toast from "react-hot-toast";
const Booking = ({ rooms }) => {
    const [value, onChange] = useState(new Date());
    const [step, setStep] = useState(1);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableTimeslots, setAvailableTimeslots] = useState([]);
    const [selectedTimeslots, setSelectedTimeslots] = useState([]);
    const [availableAddons, setAvailableAddons] = useState([]);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [hours, setHours] = useState(2);

    // New state for user information in checkout step
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    // Fetch available time slots when room and date are selected
    useEffect(() => {
        if (selectedRoom && selectedDate && hours) {
            setLoadingTimeslots(true);
            axios
                .get(route("bookable.time-slots", { room: selectedRoom.id }), {
                    params: { date: selectedDate, hours: hours },
                })
                .then((response) => {
                    setAvailableTimeslots(response.data.available_slots);
                })
                .catch((error) => {
                    console.error("Error fetching available times:", error);
                })
                .finally(() => {
                    setLoadingTimeslots(false);
                });
        } else {
            setAvailableTimeslots([]);
        }
    }, [selectedRoom, selectedDate, hours]);

    // Fetch available add-ons when a timeslot is selected
    useEffect(() => {
        if (selectedRoom && selectedDate && selectedTimeslots.length) {
            axios
                .get(route("bookable.available"), {
                    params: {
                        date: selectedDate,
                        timeslot: {
                            start_time: selectedTimeslots[0],
                            end_time: selectedTimeslots[1],
                        },
                    },
                })
                .then((response) => {
                    console.log(response.data.available_bookables);
                    setAvailableAddons(response.data.available_bookables);
                })
                .catch((error) => {
                    console.error("Error fetching available times:", error);
                });
        }
    }, [selectedRoom, selectedDate, selectedTimeslots]);

    // Move to the next step with validation
    const nextStep = () => {

        if (step === 1) {
            if (!selectedRoom) {
                toast.error("Please select a room.");
                return;
            }
        
            if (!hours || hours < 2) {
                toast.error("Minimum of two hours required.");
                return;
            }
         
        }

        if (step === 2) {
            if (!selectedDate) {
                toast.error("Please select a date.");
                return;
            }
        }

        if (step === 3) {
            if (selectedTimeslots.length === 0){
                toast.error("Please select a time slot.");
                return;
            }
        }

        if (step === 6) {
            if (!firstName.trim()){
                toast.error("First name is required.");
                return;
            }
            if (!lastName.trim()){
                toast.error("Last name is required.");
                return;
            } 
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast.error("Valid email is required.");
                return;
            }
            if (!phoneNumber.trim() || !/^\d{10,15}$/.test(phoneNumber)) {
                toast.error("Valid phone number is required.");
                return;
            }
        }
            setStep(step + 1);
        
    };

    // Move to the previous step
    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    // Handle time slot selection
    const handleTimeslotSelection = (start, end) => {
        setSelectedTimeslots([start, end]);
    };

    // Handle add-ons selection
    const handleAddonSelection = (addon) => {
        setSelectedAddons((prev) =>
            prev.includes(addon)
                ? prev.filter((a) => a !== addon)
                : [...prev, addon]
        );
    };

    const handleDateChange = (date) => {
        if (!date) return;
    
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
    
        const formattedDate = `${yyyy}-${mm}-${dd}`;
        setSelectedDate(formattedDate);

    };
    

    // Calculate total cost
    const roomSubtotal = selectedRoom ? selectedRoom.rate * hours : 0;
    const addonsSubtotal = selectedAddons.reduce(
        (sum, addon) => sum + addon.rate * hours,
        0
    );
    const totalAmount = roomSubtotal + addonsSubtotal;

    // Handle booking submission
    const handleSubmit = () => {
        Inertia.post(route("booking.store"), {
            room_id: selectedRoom.id,
            date: selectedDate,
            timeslots: selectedTimeslots,
            addons: selectedAddons,
        });
    };

    return (
        <GuestLayout>
            <div className="relative p-6 max-w-5xl mx-auto bg-white rounded-lg shadow min-h-[500px] flex flex-col">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-6 relative">
                    {[
                        "Room",
                        "Date",
                        "Time Slots",
                        "Add-ons",
                        "Review",
                        "Checkout",
                    ].map((label, index, array) => (
                        <div
                            key={index}
                            className="flex items-center justify-center w-full"
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white 
                        ${step === index + 1 ? "bg-blue-500" : "bg-gray-300"}`}
                            >
                                {index + 1}
                            </div>
                            <span
                                className={`text-sm font-semibold ml-2 ${
                                    step === index + 1
                                        ? "text-blue-600"
                                        : "text-gray-500"
                                }`}
                            >
                                {label}
                            </span>
                            {index < array.length - 1 && (
                                <div className="flex-grow border-t-2 border-gray-300 mx-2"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Room */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select a Room
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {rooms?.map((bookable) => (
                                    bookable?.room && (  
                                        <button
                                            key={bookable.id}
                                            onClick={() => setSelectedRoom(bookable)}
                                            className={`p-3 border rounded ${
                                                selectedRoom?.id === bookable.id
                                                    ? "border-blue-500 bg-blue-100"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            <h3 className="font-semibold">
                                                {bookable.room.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {bookable.room.description}
                                            </p>
                                            <p className="font-bold text-green-600">
                                                ${bookable.rate} / hour
                                            </p>
                                        </button>
                                    )
                            ))}
                        </div>
                        <label className="block mt-4 font-semibold">
                            How many hours do you need the room for?
                        </label>
                        <input
                            type="number"
                            min="2"
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value))}
                            className="p-2 border border-gray-300 rounded"
                        />
                    </div>
                )}

                {/* Step 2: Select Date */}
                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select a Date
                        </h2>
                        <div>
                            <Calendar
                                onChange={(date) => {
                                    onChange(date);  // Updates the value for the calendar
                                    handleDateChange(date);  // Updates selectedDate in the correct format
                                }}
                                value={value}
                            />
                        </div>

                        {errors.date && (
                            <p className="text-red-500">{errors.date}</p>
                        )}
                    </div>
                )}

                {/* Step 3: Select Time Slots */}
                {step === 3 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select Time Slots
                        </h2>
                        {loadingTimeslots ? (
                            <p>Loading available time slots...</p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {availableTimeslots?.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            handleTimeslotSelection(
                                                slot.start_time,
                                                slot.end_time
                                            )
                                        }
                                        className={`p-2 border rounded ${
                                            selectedTimeslots.includes(
                                                slot.start_time
                                            ) &&
                                            selectedTimeslots.includes(
                                                slot.end_time
                                            )
                                                ? "border-blue-500 bg-blue-100"
                                                : "border-gray-300"
                                        }`}
                                    > 
                                        {slot.start_time} - {slot.end_time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Step 4: Show Available Add-ons */}
                {step === 4 && (
                    <div>
                        <Typography variant="h6" gutterBottom>
                            Select Add-ons
                        </Typography>

                        {availableAddons.product?.length > 0 ||
                        availableAddons.contractor?.length > 0 ? (
                            <div>
                                {/* Products Accordion */}
                                {availableAddons.product?.length > 0 && (
                                    <Accordion>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                        >
                                            <Typography variant="subtitle1">
                                                Products
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <div className="grid grid-cols-2 gap-4">
                                                {availableAddons.product.map(
                                                    (addon) => (
                                                        <Card
                                                            key={addon.id}
                                                            className={`border ${
                                                                selectedAddons.includes(
                                                                    addon
                                                                )
                                                                    ? "border-green-500"
                                                                    : "border-gray-300"
                                                            }`}
                                                        >
                                                            <CardContent>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    fontWeight="bold"
                                                                >
                                                                    {
                                                                        addon
                                                                            .product
                                                                            .name
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                >
                                                                    {
                                                                        addon
                                                                            .product
                                                                            .description
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="body1"
                                                                    color="success.main"
                                                                    fontWeight="bold"
                                                                >
                                                                    $
                                                                    {addon.rate}{" "}
                                                                    / hour
                                                                </Typography>
                                                            </CardContent>
                                                            <CardActions>
                                                                <Button
                                                                    fullWidth
                                                                    variant={
                                                                        selectedAddons.includes(
                                                                            addon
                                                                        )
                                                                            ? "contained"
                                                                            : "outlined"
                                                                    }
                                                                    color="primary"
                                                                    onClick={() =>
                                                                        handleAddonSelection(
                                                                            addon
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedAddons.includes(
                                                                        addon
                                                                    )
                                                                        ? "Selected"
                                                                        : "Select"}
                                                                </Button>
                                                            </CardActions>
                                                        </Card>
                                                    )
                                                )}
                                            </div>
                                        </AccordionDetails>
                                    </Accordion>
                                )}

                                {/* Contractors Accordion */}
                                {availableAddons.contractor?.length > 0 && (
                                    <Accordion>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                        >
                                            <Typography variant="subtitle1">
                                                Contractors
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <div className="grid grid-cols-2 gap-4">
                                                {availableAddons.contractor.map(
                                                    (addon) => (
                                                        <Card
                                                            key={addon.id}
                                                            className={`border ${
                                                                selectedAddons.includes(
                                                                    addon
                                                                )
                                                                    ? "border-green-500"
                                                                    : "border-gray-300"
                                                            }`}
                                                        >
                                                            <CardContent>
                                                                <Typography
                                                                    variant="subtitle1"
                                                                    fontWeight="bold"
                                                                >
                                                                    {
                                                                        addon
                                                                            .contractor
                                                                            .role
                                                                            .name
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                >
                                                                    {
                                                                        addon.description
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    variant="body1"
                                                                    color="success.main"
                                                                    fontWeight="bold"
                                                                >
                                                                    $
                                                                    {addon.rate}{" "}
                                                                    / hour
                                                                </Typography>
                                                            </CardContent>
                                                            <CardActions>
                                                                <Button
                                                                    fullWidth
                                                                    variant={
                                                                        selectedAddons.includes(
                                                                            addon
                                                                        )
                                                                            ? "contained"
                                                                            : "outlined"
                                                                    }
                                                                    color="primary"
                                                                    onClick={() =>
                                                                        handleAddonSelection(
                                                                            addon
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedAddons.includes(
                                                                        addon
                                                                    )
                                                                        ? "Selected"
                                                                        : "Select"}
                                                                </Button>
                                                            </CardActions>
                                                        </Card>
                                                    )
                                                )}
                                            </div>
                                        </AccordionDetails>
                                    </Accordion>
                                )}
                            </div>
                        ) : (
                            <Typography variant="body2" color="textSecondary">
                                No add-ons available for this booking.
                            </Typography>
                        )}
                    </div>
                )}

                {/* Step 5: Review Order */}
                {step === 5 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Review Your Booking
                        </h2>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">
                                        Type
                                    </th>
                                    <th className="border p-2 text-left">
                                        Item
                                    </th>
                                    <th className="border p-2 text-left">
                                        Rate
                                    </th>
                                    <th className="border p-2 text-left">
                                        Quantity
                                    </th>
                                    <th className="border p-2 text-left">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...[selectedRoom], ...selectedAddons]?.map(
                                    (bookable) => (
                                        <tr key={bookable.id}>
                                            <td className="border p-2">
                                                {bookable.bookable_type.toUpperCase()}
                                            </td>
                                            <td className="border p-2">
                                                {bookable.room?.name || bookable.product?.name || bookable.contractor?.role.name}
                                            </td>
                                            <td className="border p-2">
                                                ${bookable.rate}
                                            </td>
                                            <td className="border p-2">
                                                {hours} hours
                                            </td>
                                            <td className="border p-2">
                                                ${bookable.rate * hours}
                                            </td>
                                        </tr>
                                    )
                                )}
                                <tr className="font-bold">
                                    <td className="border p-2" colSpan="4">
                                        Total
                                    </td>
                                    <td className="border p-2">
                                        ${totalAmount}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Step 6: Checkout */}
                {step === 6 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Checkout Information
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                                <label className="block font-semibold">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    className="p-2 border border-gray-300 rounded w-full"
                                />
                                {errors.firstName && (
                                    <p className="text-red-500">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block font-semibold">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    className="p-2 border border-gray-300 rounded w-full"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="mt-4">
                            <label className="block font-semibold">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="mt-4">
                            <label className="block font-semibold">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons Fixed at Bottom */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between p-4 border-t bg-white">
                    <button
                        onClick={prevStep}
                        className="px-4 py-2 bg-gray-300 rounded"
                        disabled={step === 1}
                    >
                        Back
                    </button>
                    {step === 6 ? (
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            Confirm Booking
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
};

export default Booking;
