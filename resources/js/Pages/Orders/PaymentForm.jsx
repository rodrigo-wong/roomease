// PaymentForm.jsx
import React, { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import {
    Card,
    CardContent,
    CardActions,
    Typography,
    Button,
    Alert,
    Box,
} from "@mui/material";
import toast from "react-hot-toast";
import { router } from "@inertiajs/react";

// Options to style the CardElement with a MUI-friendly look.
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: "16px",
            color: "#495057",
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            "::placeholder": {
                color: "#6c757d",
            },
        },
        invalid: {
            color: "#d32f2f",
            iconColor: "#d32f2f",
        },
    },
};

const PaymentForm = ({ clientSecret, order, contractors }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        const cardElement = elements.getElement(CardElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            {
                payment_method: { card: cardElement },
            }
        );

        if (error) {
            setError(error.message);
            setProcessing(false);
            toast.error(
                error ? error.message : "An error occurred. Please try again."
            );
        } else {
            console.log("Payment successful", paymentIntent);
            console.log(order);
            router.post(route("payment.store", { order: order }), {
                payment_intent: paymentIntent.id,
                contractors: contractors,
            });
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Payment Details
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Typography variant="subtitle1" gutterBottom>
                        Credit Card Information
                    </Typography>
                    <Box
                        sx={{
                            border: "1px solid #ced4da",
                            borderRadius: 1,
                            p: 2,
                            mb: 2,
                        }}
                    >
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                    </Box>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!stripe || processing}
                        fullWidth
                    >
                        {processing ? "Processing..." : "Pay Now"}
                    </Button>
                </Box>
            </CardContent>
            <CardActions
                sx={{
                    justifyContent: "center",
                    borderTop: "1px solid #e0e0e0",
                }}
            >
                <Typography variant="caption" color="textSecondary">
                    Powered by
                </Typography>
                <Box
                    component="img"
                    src="https://stripe.com/img/v3/home/twitter.png"
                    alt="Stripe Logo"
                    sx={{ height: 24, ml: 1 }}
                />
            </CardActions>
        </Card>
    );
};

export default PaymentForm;
