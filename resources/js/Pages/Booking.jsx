import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { router, usePage } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";
import ReservationReviewTable from "./Partials/ReservationReviewTable";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../css/ReactCalenderOverride.css";
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PaymentForm from "./Orders/PaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const Booking = ({ rooms }) => {
    // Booking flow states
    const [value, onChange] = useState(new Date());
    const [step, setStep] = useState(1);
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableTimeslots, setAvailableTimeslots] = useState([]);
    const [selectedTimeslots, setSelectedTimeslots] = useState([]);
    const [availableAddons, setAvailableAddons] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedContractors, setSelectedContractors] = useState([]);
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [hours, setHours] = useState(2);
    const [isReserving, setIsReserving] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [reservedOrder, setReservedOrder] = useState(null);
    // For add-ons counts
    const [selectedCounts, setSelectedCounts] = useState({});
    // Payment related state
    const [clientSecret, setClientSecret] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const { errors } = usePage().props;

    // Memoize stripePromise so it does not change on re-renders.
    const stripePromise = useMemo(
        () => loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY),
        []
    );

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((errorMessage) => {
                toast.error(errorMessage);
            });
        }
    }, [errors]);

    /**
     * Handles the selection and deselection of rooms or room groups and updates the selectedRooms state.
     * If a room group is selected, all individual rooms within that group are deselected.
     * If an individual room is selected, any room groups that include that room are deselected.
     * @param {*} bookable - The bookable item (room or room group) to be selected or deselected.
     */
    const handleRoomSelection = (bookable) => {
        // Check if room is already selected
        const isSelected = selectedRooms.some(
            (roomOrRoomGroup) => roomOrRoomGroup.id === bookable.id
        );
        if (isSelected) {
            setSelectedRooms(
                selectedRooms.filter(
                    (roomOrRoomGroup) => roomOrRoomGroup.id !== bookable.id
                )
            );
        } else {
            let updatedSelection = [...selectedRooms];
            if (bookable.is_room_group && bookable.room_ids) {
                updatedSelection = updatedSelection.filter(
                    (room) =>
                        !bookable.room_ids.includes(room.id) ||
                        room.is_room_group
                );
            } else {
                updatedSelection = updatedSelection.filter(
                    (room) =>
                        !room.is_room_group ||
                        !room.room_ids ||
                        !room.room_ids.includes(bookable.id)
                );
            }
            updatedSelection.push(bookable);
            setSelectedRooms(updatedSelection);
        }
    };

    /**
     *  Helper function to check if a room or room group is disabled based on the selected rooms.
     * If a room group is selected, all individual rooms within that group are disabled.
     * @param {*} bookable  - The bookable item (room or room group) to check.
     * @returns
     */
    const isRoomDisabled = (bookable) => {
        if (!bookable.is_room_group) {
            return selectedRooms.some(
                (room) =>
                    room.is_room_group &&
                    room.room_ids &&
                    room.room_ids.includes(bookable.id)
            );
        }
        return bookable.room_ids?.some((roomId) =>
            selectedRooms.some(
                (room) => !room.is_room_group && room.id === roomId
            )
        );
    };

    /**
     * The count is the total number of rooms (bookable room types) selected, and details is a string listing the names of the selected rooms.
     * @returns {Object} - An object containing the count and details of selected rooms.
     *
     */
    const getSelectedRoomsInfo = () => {
        let roomCount = 0;
        let roomDetails = [];

        selectedRooms.forEach((room) => {
            if (room.is_room_group) {
                roomCount += room.room_ids?.length || 0;
                roomDetails.push(`${room.display_name}`);
            } else {
                roomCount += 1;
                roomDetails.push(room.room?.name);
            }
        });

        return {
            count: roomCount,
            details: roomDetails.join(", "),
        };
    };

    // Fetch available time slots when room, date, or hours change
    useEffect(() => {
        if (selectedRooms.length > 0 && selectedDate && hours) {
            setLoadingTimeslots(true);
            const bookableIds = selectedRooms.map((bookable) => bookable.id);
            axios
                .get(route("bookable.time-slots-multi"), {
                    params: {
                        rooms: bookableIds,
                        date: selectedDate,
                        hours: hours,
                    },
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
    }, [selectedRooms, selectedDate, hours]);

    // Fetch available add-ons when a timeslot is selected
    useEffect(() => {
        if (
            selectedRooms.length > 0 &&
            selectedDate &&
            selectedTimeslots.length
        ) {
            const bookableIds = selectedRooms.map((room) => room.id);
            axios
                .get(route("bookable.available-addons"), {
                    params: {
                        rooms: bookableIds,
                        date: selectedDate,
                        timeslot: {
                            start_time: selectedTimeslots[0],
                            end_time: selectedTimeslots[1],
                        },
                    },
                })
                .then((response) => {
                    setAvailableAddons(response.data.available_bookables);
                })
                .catch((error) => {
                    console.error("Error fetching available add-ons:", error);
                });
        }
    }, [selectedRooms, selectedDate, selectedTimeslots]);

    // Update selectedContractors from available add-ons and counts
    useEffect(() => {
        if (availableAddons.contractor?.length > 0) {
            const updatedContractors = availableAddons.contractor
                .map((group) => {
                    const count = selectedCounts[group.role] || 0;
                    if (count > 0) {
                        return {
                            bookable_type: "contractor",
                            role: group.role,
                            role_name: group.role_name,
                            quantity: count,
                            rate: group.rate,
                            emails: group.contractors,
                        };
                    }
                    return null;
                })
                .filter((item) => item !== null);
            setSelectedContractors(updatedContractors);
        }
    }, [selectedCounts, availableAddons.contractor]);

    // Countdown timer effect
    useEffect(() => {
        let timerId;
        if (timeLeft !== null && timeLeft > 0) {
            timerId = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerId);
                        cancelOrder();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerId);
    }, [timeLeft]);

    // Format seconds as mm:ss
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s
            .toString()
            .padStart(2, "0")}`;
    };

    // Cancel order if timer expires
    const cancelOrder = async () => {
        await axios
            .post(route("order.destroy", { order: reservedOrder }))
            .then((response) => {
                toast.error("Order canceled");
                setReservedOrder(null);
                setClientSecret(null);
                setTimeLeft(null);
            })
            .catch((error) => {
                console.error("Error canceling order", error);
            });
    };

    // Navigation handlers
    const nextStep = () => {
        // Validate current step
        if (step === 1) {
            if (selectedRooms.length === 0) {
                toast.error("Please select at least one room.");
                return;
            }
            if (!hours || hours < 2) {
                toast.error("Minimum of two hours required.");
                return;
            }
        }
        if (step === 2 && !selectedDate) {
            toast.error("Please select a date.");
            return;
        }
        if (step === 3 && selectedTimeslots.length === 0) {
            toast.error("Please select a time slot.");
            return;
        }
        // For steps 1-4, simply move forward.
        setStep(step + 1);
    };

    // prevStep remains unchanged except for step 6 (Payment step)
    const prevStep = () => {
        // If on payment step, clear payment details and go back to checkout (step 5)
        if (step === 6) {
            setClientSecret(null);
            setTimeLeft(null);
            setStep(5);
            axios.delete(route("order.destroy", { order: reservedOrder }));
        } else {
            setStep(step - 1);
        }
    };

    // Handle timeslot selection
    const handleTimeslotSelection = (start, end) => {
        setSelectedTimeslots([start, end]);
    };

    // Handlers for product add-ons
    const handleSelectProduct = (productAddon) => {
        const id = productAddon.id;
        setSelectedCounts((prev) => ({ ...prev, [id]: 1 }));

        setSelectedProducts((prev) => {
            if (!prev.some((p) => p.id === productAddon.id)) {
                return [
                    ...prev,
                    {
                        ...productAddon,
                        bookable_type: "product",
                        quantity: 1,
                    },
                ];
            }
            return prev;
        });
    };

    const handleDeselectProduct = (productAddon) => {
        const id = productAddon.id;
        setSelectedCounts((prev) => ({ ...prev, [id]: 0 }));

        setSelectedProducts((prev) =>
            prev.filter((p) => p.id !== productAddon.id)
        );
    };

    // Handlers for contractor add-ons
    const handleIncrement = (roleId, availableQuantity) => {
        setSelectedCounts((prev) => {
            const current = prev[roleId] || 0;
            if (current < availableQuantity) {
                return { ...prev, [roleId]: current + 1 };
            }
            return prev;
        });
    };
    const handleDecrement = (roleId) => {
        setSelectedCounts((prev) => {
            const current = prev[roleId] || 0;
            if (current > 0) {
                return { ...prev, [roleId]: current - 1 };
            }
            return prev;
        });
    };

    /**
     * This function handles the date change event from the calendar.
     * It formats the selected date to "YYYY-MM-DD" and updates the selectedDate state.
     * @param {Date} date - The date selected by the user.
     * @returns
     */
    const handleDateChange = (date) => {
        if (!date) return;
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        setSelectedDate(`${yyyy}-${mm}-${dd}`);
    };

    // Calculate totals
    const roomsSubtotal = selectedRooms.reduce(
        (sum, room) => sum + room.rate * hours,
        0
    );
    const productsSubtotal = selectedProducts.reduce(
        (sum, addon) => sum + addon.rate * hours * (addon.quantity ?? 1),
        0
    );
    const contractorsSubtotal = selectedContractors.reduce(
        (sum, addon) => sum + addon.rate * addon.quantity * hours,
        0
    );
    const totalAmount = roomsSubtotal + productsSubtotal + contractorsSubtotal;

    const bookingItems = [
        ...selectedRooms,
        ...selectedProducts,
        ...selectedContractors,
    ];

    // Handle submit on Checkout step (step 5)
    // This will reserve the order and then move to the Payment step (step 6)
    const handleReserve = () => {
        setIsReserving(true);
        const addons = [...selectedProducts, ...selectedContractors];
        const roomIds = selectedRooms.map((room) => room.id);

        const bookingData = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phoneNumber,
            room_ids: roomIds,
            date: selectedDate,
            timeslots: selectedTimeslots,
            addons,
            total_amount: totalAmount,
            hours: hours,
            order: reservedOrder,
        };

        axios
            .post(route("checkout"), bookingData)
            .then((response) => {
                // Set the client secret and reserved order returned from your API
                setClientSecret(response.data.client_secret);
                setReservedOrder(response.data.order);
                // Start a 15-minute countdown (900 seconds)
                setTimeLeft(900);
                // Move to Payment step (step 6)
                setStep(6);
            })
            .catch((error) => {
                setIsReserving(false);
                if (
                    error.response &&
                    error.response.data &&
                    error.response.data.errors
                ) {
                    const errors = error.response.data.errors;
                    Object.values(errors).forEach((errorMessage) => {
                        toast.error(errorMessage);
                    });
                } else {
                    toast.error(error.response.data.error);
                }
                console.error(error.response);
            })
            .finally(() => {
                setIsReserving(false);
            });
    };

    return (
        <GuestLayout>
            <div className="relative p-6 max-w-5xl mx-auto bg-white rounded-lg shadow min-h-[500px] flex flex-col">
                {/* Stepper UI */}
                <div className="flex items-center justify-center mb-6 relative">
                    {[
                        "Rooms",
                        "Date",
                        "Time Slots",
                        "Add-ons",
                        "Checkout",
                        "Payment",
                    ].map((label, index, array) => (
                        <div
                            key={index}
                            className="flex items-center justify-center w-full"
                        >
                            <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                                    step === index + 1
                                        ? "bg-blue-500"
                                        : "bg-gray-300"
                                }`}
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

                {/* Step 1: Room Selection */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select Rooms
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {rooms?.map((bookable) => {
                                // Check if this room should be disabled
                                const isDisabled = isRoomDisabled(bookable);
                                return (
                                    <button
                                        key={bookable.id}
                                        onClick={() =>
                                            handleRoomSelection(bookable)
                                        }
                                        className={`p-3 border rounded ${
                                            selectedRooms.some(
                                                (room) =>
                                                    room.id === bookable.id
                                            )
                                                ? "border-blue-500 bg-blue-100"
                                                : isDisabled
                                                ? "border-gray-300 bg-gray-100 opacity-50"
                                                : "border-gray-300"
                                        }`}
                                        disabled={isDisabled}
                                    >
                                        {/* Display the room group label if it's a room group */}
                                        {bookable.is_room_group && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                                                Room Group
                                            </span>
                                        )}

                                        <h3 className="font-semibold">
                                            {bookable.is_room_group
                                                ? bookable.display_name
                                                : bookable.room?.name}
                                        </h3>

                                        <p className="text-sm text-gray-600">
                                            {bookable.is_room_group
                                                ? ""
                                                : bookable.room?.description}
                                        </p>

                                        {bookable.is_room_group && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Total capacity:{" "}
                                                {bookable.display_capacity}
                                            </p>
                                        )}

                                        <p className="font-bold text-green-600 mt-1">
                                            ${bookable.rate} / hour
                                        </p>

                                        {isDisabled &&
                                            !selectedRooms.some(
                                                (room) =>
                                                    room.id === bookable.id
                                            ) && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {bookable.is_room_group
                                                        ? "Cannot select when individual rooms from this group are selected"
                                                        : "Part of a selected room group"}
                                                </p>
                                            )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Display selected room(s) or room group summary */}
                        <div className="mt-4">
                            <p className="text-sm text-gray-600">
                                Selected: {getSelectedRoomsInfo().count} room(s)
                            </p>
                            {selectedRooms.length > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {getSelectedRoomsInfo().details}
                                </p>
                            )}
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

                {/* Step 2: Date Selection */}
                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select a Date
                        </h2>
                        <Calendar
                            onChange={(date) => {
                                onChange(date);
                                handleDateChange(date);
                            }}
                            value={value}
                            minDate={new Date(Date.now() + 86400000)} // Users can only select dates from tomorrow onwards
                        />
                    </div>
                )}

                {/* Step 3: Time Slots Selection */}
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

                {/* Step 4: Add-ons Selection */}
                {step === 4 && (
                    <div
                        className="overflow-y-auto pb-20"
                        style={{ maxHeight: "calc(100vh - 300px)" }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Select Add-ons
                        </Typography>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1">
                                    Products
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {availableAddons.product &&
                                availableAddons.product.length > 0 ? (
                                    <div className="space-y-4">
                                        {availableAddons.product.map(
                                            (addon) => (
                                                <div
                                                    key={addon.id}
                                                    className="flex items-center justify-between border p-3 rounded hover:bg-gray-50"
                                                >
                                                    <div>
                                                        <Typography variant="subtitle2">
                                                            {addon.product.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                        >
                                                            ${addon.rate} / hr
                                                        </Typography>
                                                        {addon.product
                                                            .serial_number && (
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                            >
                                                                Serial:{" "}
                                                                {
                                                                    addon
                                                                        .product
                                                                        .serial_number
                                                                }
                                                                {", "}
                                                            </Typography>
                                                        )}
                                                        {addon.product
                                                            .brand && (
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                                className="ml-2"
                                                            >
                                                                Brand:{" "}
                                                                {
                                                                    addon
                                                                        .product
                                                                        .brand
                                                                }
                                                                {", "}
                                                            </Typography>
                                                        )}
                                                        {addon.product
                                                            .description && (
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                                className="ml-2"
                                                            >
                                                                Description:{" "}
                                                                {
                                                                    addon
                                                                        .product
                                                                        .description
                                                                }
                                                            </Typography>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                selectedProducts.some(
                                                                    (p) =>
                                                                        p.id ===
                                                                        addon.id
                                                                )
                                                            ) {
                                                                handleDeselectProduct(
                                                                    addon
                                                                );
                                                            } else {
                                                                handleSelectProduct(
                                                                    addon
                                                                );
                                                            }
                                                        }}
                                                        className={`px-3 py-2 rounded ${
                                                            selectedProducts.some(
                                                                (p) =>
                                                                    p.id ===
                                                                    addon.id
                                                            )
                                                                ? "bg-blue-500 text-white"
                                                                : "border border-gray-300 bg-white"
                                                        }`}
                                                    >
                                                        {selectedProducts.some(
                                                            (p) =>
                                                                p.id ===
                                                                addon.id
                                                        )
                                                            ? "Selected"
                                                            : "Add"}
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                    >
                                        No product add-ons available for the
                                        selected time slot.
                                    </Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>

                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="subtitle1">
                                    Contractors
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {availableAddons.contractor &&
                                availableAddons.contractor.length > 0 ? (
                                    <div className="space-y-4">
                                        {availableAddons.contractor.map(
                                            (group) => (
                                                <div
                                                    key={group.role}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div>
                                                        <Typography variant="subtitle2">
                                                            {group.role_name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                        >
                                                            ${group.rate} / hr
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                        >
                                                            Available:{" "}
                                                            {group.quantity}
                                                        </Typography>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={() =>
                                                                handleDecrement(
                                                                    group.role
                                                                )
                                                            }
                                                            className="px-2 py-1 border rounded"
                                                        >
                                                            –
                                                        </button>
                                                        <span className="mx-2">
                                                            {selectedCounts[
                                                                group.role
                                                            ] || 0}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                handleIncrement(
                                                                    group.role,
                                                                    group.quantity
                                                                )
                                                            }
                                                            className="px-2 py-1 border rounded"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                    >
                                        No contractor add-ons available for the
                                        selected time slot.
                                    </Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </div>
                )}

                {/* Step 5: Checkout (Reservation Review & Contact Info) */}
                {step === 5 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                        {/* Booking summary */}
                        <ReservationReviewTable
                            bookingItems={bookingItems}
                            hours={hours}
                            totalAmount={totalAmount}
                        />
                        <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                        {/* Contact information form */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                                    required
                                />
                            </div>
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
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block font-semibold">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block font-semibold">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full"
                                placeholder="Enter phone number"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Step 6: Payment */}
                {step === 6 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Order Details
                        </h2>
                        <ReservationReviewTable
                            bookingItems={bookingItems}
                            hours={hours}
                            totalAmount={totalAmount}
                        />

                        <h2 className="text-lg font-semibold mb-4">Payment</h2>
                        {/* Optionally repeat a booking summary or order details */}
                        {timeLeft !== null && (
                            <div className="mb-4">
                                <Typography
                                    variant="subtitle1"
                                    className="text-red-600"
                                >
                                    Time Remaining: {formatTime(timeLeft)}
                                </Typography>
                            </div>
                        )}
                        {/* Render PaymentForm once clientSecret is available */}
                        {clientSecret ? (
                            <Elements stripe={stripePromise}>
                                <PaymentForm
                                    clientSecret={clientSecret}
                                    contractors={selectedContractors}
                                    order={reservedOrder}
                                />
                            </Elements>
                        ) : (
                            <p>Loading payment details...</p>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="sticky bottom-0 left-0 w-full flex justify-between p-4 border-t mt-4 mb-5 bg-white">
                    <button
                        onClick={prevStep}
                        className="px-4 py-2 bg-gray-300 rounded"
                        disabled={step === 1}
                    >
                        Back
                    </button>
                    {step < 6 && (
                        <button
                            onClick={step === 5 ? handleReserve : nextStep}
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            {step === 5
                                ? isReserving
                                    ? "Reserving..."
                                    : "Next"
                                : "Next"}
                        </button>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
};

export default Booking;
