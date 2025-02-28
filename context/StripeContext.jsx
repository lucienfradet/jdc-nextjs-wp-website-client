"use client";

import { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Create the context
const StripeContext = createContext();

export function StripeProvider({ children }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, succeeded, error
  const [paymentError, setPaymentError] = useState(null);
  
  // Create a function to initialize a payment intent
  const createPaymentIntent = async (amount, metadata = {}) => {
    try {
      setPaymentStatus('processing');
      setPaymentError(null);
      
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'cad',
          paymentMethodType: 'card',
          metadata
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setPaymentStatus('error');
        setPaymentError(data.error);
        return false;
      }
      
      setClientSecret(data.clientSecret);
      return true;
    } catch (error) {
      setPaymentStatus('error');
      setPaymentError(error.message);
      return false;
    }
  };
  
  // Create a function to complete the order after payment
  const completeOrder = async (orderData, paymentIntentId) => {
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          paymentIntentId
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error completing order:', error);
      throw error;
    }
  };
  
  // Reset payment state
  const resetPayment = () => {
    setClientSecret(null);
    setPaymentStatus('idle');
    setPaymentError(null);
  };
  
  // Prepare the Stripe elements configuration 
  const options = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#24311B',
        colorBackground: '#F5F0E1',
        colorText: '#24311B',
        colorDanger: '#A22D22',
        fontFamily: 'Roboto, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };
  
  // Only render the Stripe Elements wrapper if we have a client secret
  if (clientSecret) {
    return (
      <StripeContext.Provider value={{
        createPaymentIntent,
        completeOrder,
        resetPayment,
        paymentStatus,
        paymentError,
        clientSecret
      }}>
        <Elements stripe={stripePromise} options={{...options, clientSecret}}>
          {children}
        </Elements>
      </StripeContext.Provider>
    );
  }
  
  // Otherwise, render without the Elements wrapper
  return (
    <StripeContext.Provider value={{
      createPaymentIntent,
      completeOrder,
      resetPayment,
      paymentStatus,
      paymentError,
      clientSecret
    }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  return useContext(StripeContext);
}
