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
  const [orderNumber, setOrderNumber] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, succeeded, error
  const [paymentError, setPaymentError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [paymentIntentId, setPaymentId] = useState(null);
  
  // Create a function to initialize a payment intent
  const createPaymentIntent = async (amount, orderData, taxes, shippingCost, metadata = {}) => {
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
          metadata,
          idempotencyKey: metadata.order_number
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setPaymentStatus('error');
        setPaymentError(data.error);
        return false;
      }
      
      // Store important information from the response
      const newOrderNumber = data.orderNumber;
      const paymentIntentId = data.paymentIntentId;

      if (!newOrderNumber || !paymentIntentId) {
        throw new Error('Missing orderNumber or paymentIntentId in the response');
      }

      // Set the client secret for Stripe Elements
      setClientSecret(data.clientSecret);
      setPaymentId(paymentIntentId);
      setOrderNumber(newOrderNumber);
      // Store order data for later use when payment is initiated
      setOrderData({
        ...orderData,
        taxes: taxes,
        shippingCost
      });

      return true;
    } catch (error) {
      console.error('Error in payment flow:', error);
      setPaymentStatus('error');
      setPaymentError(error.message);
      return false;
    }
  };

  const createPendingOrder = async () => {
    try {
      // Safety check - ensure all required data is available
      if (!orderNumber || !orderData || !paymentIntentId) {
        throw new Error('Payment information not fully loaded. Please wait a moment and try again.');
      }

      // Create a pending order
      const pendingOrderResponse = await fetch('/api/orders/create-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          orderData,
          paymentIntentId,
          status: 'pending'
        }),
      });

      if (!pendingOrderResponse.ok) {
        const errorData = await pendingOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create pending order');
      }

      // Success - the pending order was created
      // The webhook will handle the actual payment confirmation
      return true;
    } catch (error) {
      console.error('Error creating pending order:', error);
      throw error;
    }
  }
  
  const handlePaymentSuccess = (paymentIntent) => {
    // Store data in session storage for the confirmation page
    if (orderNumber) {
      sessionStorage.setItem('orderConfirmation', JSON.stringify({
        orderNumber,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        status: 'processing' // The webhook will update to 'paid' when it processes
      }));
      
      setPaymentStatus('succeeded');
      return true;
    }
    return false;
  };
  
  const resetPayment = () => {
    setClientSecret(null);
    setOrderNumber(null);
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
    locale: 'fr',
    clientSecret
  };
  
  return (
    <StripeContext.Provider value={{
      createPaymentIntent,
      createPendingOrder,
      handlePaymentSuccess,
      resetPayment,
      paymentStatus,
      paymentError,
      clientSecret,
      orderNumber
    }}>
      {clientSecret ? (
        <Elements 
          stripe={stripePromise} 
          options={options}
          key={clientSecret} // This forces a remount when clientSecret changes
        >
          {children}
        </Elements>
      ) : (
        children
      )}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  return useContext(StripeContext);
}
