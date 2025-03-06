// Will delete this component
"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from '@/styles/checkout/PaymentGateway.module.css';
import { renderContent } from '@/lib/textUtils';
import StripePaymentForm from './StripePaymentForm';
import { useStripe as useStripeContext } from '@/context/StripeContext';

const PaymentGateway = forwardRef(({ onPaymentDataChange, abonnementPageData, total }, ref) => {
  const abonnementPageContent = abonnementPageData?.acfFields || {};
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [localErrors, setLocalErrors] = useState({});
  
  // Get Stripe context
  const { 
    clientSecret, 
    createPaymentIntent, 
    paymentStatus, 
    paymentError 
  } = useStripeContext();

  // Use imperative handle to expose validation method to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      const errors = {};
      
      if (paymentMethod === 'stripe') {
        // For Stripe, validate if payment was successful
        if (paymentStatus !== 'succeeded') {
          errors.payment = "Veuillez compléter le paiement avec Stripe";
        }
      }
      
      setLocalErrors(errors);
      return { hasErrors: Object.keys(errors).length > 0, errors };
    },
    getFirstErrorElement: () => {
      return document.querySelector(`.${styles.errorText}`);
    },
    getPaymentMethod: () => paymentMethod
  }));

  // When payment method changes to 'stripe', create a payment intent
  useEffect(() => {
    // Only create payment intent if method is stripe and we don't already have a client secret
    const initializeStripePayment = async () => {
      if (paymentMethod === 'stripe' && !clientSecret && total) {
        await createPaymentIntent(total, {
          customerEmail: 'customer-email', // This would come from the form data
          orderItems: 'order-items-summary' // This would be a string summary of the cart items
        });
      }
    };
    
    initializeStripePayment();
  }, [paymentMethod, clientSecret, createPaymentIntent, total]);
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => (event) => {
    // Prevent any default form submission
    event.preventDefault();

    setPaymentMethod(method);

    onPaymentDataChange({ method });
  };
  
  // Handle Stripe payment completion
  const handleStripePaymentComplete = (paymentIntent) => {
    console.log('Payment success:', paymentIntent);
    onPaymentDataChange({ 
      method: 'stripe',
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'succeeded'
    });
  };
  
  // Handle Stripe payment error
  const handleStripePaymentError = (error) => {
    console.error('Payment error:', error);
    setLocalErrors(prev => ({
      ...prev,
      stripePayment: error.message
    }));
    
    onPaymentDataChange({ 
      method: 'stripe',
      paymentStatus: 'failed',
      error: error.message
    });
  };
  
  return (
    <div className={styles.paymentGateway}>
      <h3>Méthode de paiement</h3>
      
      <div className={styles.paymentMethods}>
        <label className={`${styles.paymentMethod} ${paymentMethod === 'stripe' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'stripe'}
            onChange={handlePaymentMethodChange('stripe')}
          />
          <span className={styles.radioButton}></span>
          <span className={styles.methodName}>Carte de crédit (Stripe)</span>
        </label>

        <label className={`${styles.paymentMethod} ${paymentMethod === 'bank-transfer' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'bank-transfer'}
            onChange={handlePaymentMethodChange('bank-transfer')}
          />
          <span className={styles.radioButton}></span>
          <span className={styles.methodName}>Virement bancaire (Instructions à suivre)</span>
        </label>
      </div>
      
      {paymentMethod === 'stripe' && (
        <div className={styles.stripeContainer}>
          {clientSecret ? (
            <StripePaymentForm
              onPaymentComplete={handleStripePaymentComplete}
              onError={handleStripePaymentError}
            />
          ) : (
            <div className={styles.loadingMessage}>
              Préparation du formulaire de paiement...
            </div>
          )}

          {localErrors.stripePayment && (
            <p className={styles.errorText}>{localErrors.stripePayment}</p>
          )}

          <div className={styles.securePaymentInfo}>
            <div className={styles.secureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p>Paiement sécurisé par Stripe</p>
          </div>
        </div>
      )}
      
      {paymentMethod === 'bank-transfer' && (
        <div className={styles.bankTransferInfo}>
          {renderContent(abonnementPageContent["paiments-virement-p"])}
        </div>
      )}
    </div>
  );
});

PaymentGateway.displayName = 'PaymentGateway';

export default PaymentGateway;
