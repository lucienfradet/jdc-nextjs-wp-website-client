"use client";

import { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCsrf } from '@/context/CsrfContext';

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
  
  // Get CSRF token from context
  const { csrfToken } = useCsrf();
  
  // Create a function to initialize a payment intent
  const createPaymentIntent = async (amount, orderData, taxes, shippingCost, metadata = {}) => {
    try {
      setPaymentStatus('processing');
      setPaymentError(null);
      
      // Prepare the full order data for validation
      const fullOrderData = {
        ...orderData,
        taxes,
        shippingCost,
        total: amount
      };

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '' // Include CSRF token in header
        },
        body: JSON.stringify({
          amount,
          currency: 'cad',
          paymentMethodType: 'card',
          metadata,
          idempotencyKey: metadata.order_number,
          orderData: fullOrderData,
          csrf_token: csrfToken // Also include in body for compatibility
        }),
      });

      // First parse the response JSON regardless of status code
      const data = await response.json();
      
      // Check if the request was not successful (non-200 status)
      if (!response.ok) {
        // Handle validation errors - these come with a 400 status code
        if (data.validationFailed) {
          console.log('Validation error detected:', data);
          setPaymentStatus('error');
          setPaymentError({
            type: 'validation',
            message: data.error || 'Validation failed',
            discrepancies: data.discrepancies || [],
            details: data.details || 'The prices may have changed since you added items to your cart.'
          });
          return false;
        }
        
        // Handle other API errors
        setPaymentStatus('error');
        setPaymentError({
          type: 'general',
          message: data.error || `Request failed with status ${response.status}`
        });
        return false;
      }
      
      // Handle any errors in the response body (even if status was 200)
      if (data.error) {
        setPaymentStatus('error');
        setPaymentError({
          type: 'general',
          message: data.error
        });
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
      
      // If we received validated data from the server, use that instead
      if (data.validatedData) {
        // Store order data with validated amounts for later use
        setOrderData({
          ...orderData,
          taxes: data.validatedData.taxDetails || taxes,
          shippingCost: data.validatedData.shipping,
          subtotal: data.validatedData.subtotal,
          total: data.validatedData.total
        });
      } else {
        // Store original order data
        setOrderData({
          ...orderData,
          taxes: taxes,
          shippingCost
        });
      }

      return true;
    } catch (error) {
      console.error('Error in payment flow:', error);
      setPaymentStatus('error');
      setPaymentError({
        type: 'system',
        message: error.message
      });
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
          'X-CSRF-Token': csrfToken || '' // Include CSRF token in header
        },
        body: JSON.stringify({
          orderNumber: orderNumber,
          orderData,
          paymentIntentId,
          status: 'pending',
          csrf_token: csrfToken // Also include in body for compatibility
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
      setPaymentError,
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
