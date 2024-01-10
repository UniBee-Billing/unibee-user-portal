import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import axios from "axios";

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export default function CheckoutForm() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    // Create a Checkout Session as soon as the page loads
    axios
      .post(
        "/create-checkout-session",
        {},
        {
          headers: {
            Authorization: `${token}`, // Bearer: ******
          },
        }
      )
      .then((data) => {
        setClientSecret(data.clientSecret);
      });
  }, []);

  return (
    <div id="checkout">
      {clientSecret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}
