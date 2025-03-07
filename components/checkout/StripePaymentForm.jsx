"use client";

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useStripe as useStripeContext } from '@/context/StripeContext';
import styles from '@/styles/checkout/PaymentGateway.module.css';

const StripePaymentForm = ({ onPaymentComplete, onError, isSubmitting }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { handlePaymentSuccess } = useStripeContext();
  
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Combined loading state
  const isLoading = localIsLoading || isSubmitting;
  
  // Handle form submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setLocalIsLoading(true);
    setErrorMessage(null);
    
    // Trigger form validation and create payment method
    const { error: submitError } = await elements.submit();
    
    if (submitError) {
      setErrorMessage(submitError.message);
      setLocalIsLoading(false);
      onError && onError(submitError);
      return;
    }
    
    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      }
    });

    if (error) {
      // Handle error in UI
      setErrorMessage(error.message);
      onError && onError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment completed - while the webhook will handle the actual order processing,
      // we still need to handle the UI/UX flow for the user
      handlePaymentSuccess(paymentIntent);
      onPaymentComplete && onPaymentComplete(paymentIntent);
    } else if (paymentIntent && paymentIntent.status === 'processing') {
      // Payment is processing - it's async in the background but we can still
      // move the user to a success page since our webhook will handle the final state
      handlePaymentSuccess(paymentIntent);
      onPaymentComplete && onPaymentComplete(paymentIntent);
    } else {
      setErrorMessage("Une erreur inattendue s'est produite.");
      onError && onError(new Error("Unexpected payment status"));
    }

    setLocalIsLoading(false);
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
