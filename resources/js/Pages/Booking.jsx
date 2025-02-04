import React, { useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import axios from "axios";
import GuestLayout from "@/Layouts/GuestLayout";

const Booking = ({ rooms }) => {
    const [step, setStep] = useState(1);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableTimeslots, setAvailableTimeslots] = useState([]);
    const [selectedTimeslots, setSelectedTimeslots] = useState([]);
    const [availableAddons, setAvailableAddons] = useState([]);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [loadingTimeslots, setLoadingTimeslots] = useState(false);
    const [hours, setHours] = useState(2);
    const [errors, setErrors] = useState({}); // Store validation errors

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
                    setAvailableAddons(response.data.available_bookables);
                })
                .catch((error) => {
                    console.error("Error fetching available times:", error);
                });
        }
    }, [selectedRoom, selectedDate, selectedTimeslots]);

    // Move to the next step with validation
    const nextStep = () => {
        let newErrors = {};

        if (step === 1) {
            if (!selectedRoom) newErrors.room = "Please select a room.";
            if (!hours || hours < 2)
                newErrors.hours = "Minimum booking is 2 hours.";
        }

        if (step === 2) {
            if (!selectedDate) newErrors.date = "Please select a date.";
        }

        if (step === 3) {
            if (selectedTimeslots.length === 0)
                newErrors.timeslots = "Please select a time slot.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setStep(step + 1);
        }
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
                <div className="flex items-center justify-between mb-6 relative">
                    {["Room", "Date", "Time Slots", "Add-ons", "Checkout"].map(
                        (label, index, array) => (
                            <div
                                key={index}
                                className="flex items-center w-full"
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
                        )
                    )}
                </div>

                {/* Step 1: Select Room */}
                {step === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select a Room
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {rooms?.map((room) => (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedRoom(room)}
                                    className={`p-3 border rounded ${
                                        selectedRoom?.id === room.id
                                            ? "border-blue-500 bg-blue-100"
                                            : "border-gray-300"
                                    }`}
                                >
                                    {room.name}
                                </button>
                            ))}
                        </div>
                        {errors.room && (
                            <p className="text-red-500">{errors.room}</p>
                        )}
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
                        {errors.hours && (
                            <p className="text-red-500">{errors.hours}</p>
                        )}
                    </div>
                )}

                {/* Step 2: Select Date */}
                {step === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select a Date
                        </h2>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded"
                        />
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
                                {availableTimeslots.map((slot, index) => (
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
                                            )
                                            && selectedTimeslots.includes(
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
                        {errors.timeslots && (
                            <p className="text-red-500">{errors.timeslots}</p>
                        )}
                    </div>
                )}
                {/* Step 4: Show Available Add-ons */}
                {step === 4 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Select Add-ons
                        </h2>
                        {availableAddons.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {availableAddons.map((addon) => (
                                    <button
                                        key={addon.id}
                                        onClick={() =>
                                            handleAddonSelection(addon)
                                        }
                                        className={`p-3 border rounded text-left ${
                                            selectedAddons.includes(addon)
                                                ? "border-green-500 bg-green-100"
                                                : "border-gray-300"
                                        }`}
                                    >
                                        <h3 className="font-semibold">
                                            {addon.name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {addon.description}
                                        </p>
                                        <p className="font-bold text-green-600">
                                            ${addon.rate} / hour
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                No add-ons available for this booking.
                            </p>
                        )}
                    </div>
                )}
                {/* Step 5: Checkout */}
                {step === 5 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Review Your Booking
                        </h2>
                        <p>
                            <strong>Room:</strong> {selectedRoom?.name}
                        </p>
                        <p>
                            <strong>Date:</strong> {selectedDate}
                        </p>
                        <p>
                            <strong>Time Slots:</strong>{" "}
                            {selectedTimeslots.join(", ")}
                        </p>
                        <p>
                            <strong>Add-ons:</strong>{" "}
                            {selectedAddons.map((a) => a.name).join(", ") ||
                                "None"}
                        </p>
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
                    {step === 5 ? (
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
