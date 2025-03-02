"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from '@/styles/checkout/PaymentGateway.module.css';

const StripePaymentForm = ({ onPaymentComplete, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Handle form submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    // Trigger form validation and create payment method
    const { error: submitError } = await elements.submit();
    
    if (submitError) {
      setErrorMessage(submitError.message);
      setIsLoading(false);
      onError && onError(submitError);
      return;
    }
    
    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    
    if (error) {
      setErrorMessage(error.message);
      onError && onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      onPaymentComplete && onPaymentComplete(paymentIntent);
    } else {
      setErrorMessage("Une erreur inattendue s'est produite.");
      onError && onError(new Error("Unexpected payment status"));
    }
    
    setIsLoading(false);
  };
  
  return (
    <div className={styles.stripeForm}>
      {/* Show loading state if Stripe is not yet available */}
      {!stripe || !elements ? (
        <div className={styles.loadingMessage}>
          Chargement du formulaire de paiement...
        </div>
      ) : (
        <>
          <PaymentElement />

          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}

          <button 
            type="button" 
            onClick={handlePaymentSubmit}
            disabled={!stripe || isLoading} 
            className={styles.stripeSubmitButton}
          >
            {isLoading ? 'Traitement en cours...' : 'Payer maintenant'}
          </button>
        </>
      )}
    </div>
  );
};

export default StripePaymentForm;
