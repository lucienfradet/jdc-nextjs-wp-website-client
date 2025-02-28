"use client";

import { useStripe, useElements } from '@stripe/react-stripe-js';
import StripePaymentForm from './StripePaymentForm';
import styles from '@/styles/checkout/PaymentGateway.module.css';

const StripePaymentWrapper = ({ onPaymentComplete, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  if (!stripe || !elements) {
    return (
      <div className={styles.loadingMessage}>
        Chargement du formulaire de paiement...
      </div>
    );
  }

  return (
    <StripePaymentForm 
      stripe={stripe} 
      elements={elements} 
      onPaymentComplete={onPaymentComplete} 
      onError={onError} 
    />
  );
};

export default StripePaymentWrapper;
