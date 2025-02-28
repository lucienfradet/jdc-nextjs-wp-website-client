"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from '@/styles/checkout/PaymentGateway.module.css';
import { renderContent } from '@/lib/textUtils';
import StripePaymentWrapper from './StripePaymentWrapper';
import { useStripe as useStripeContext } from '@/context/StripeContext';

const PaymentGateway = forwardRef(({ onPaymentDataChange, abonnementPageData, total }, ref) => {
  const abonnementPageContent = abonnementPageData.acfFields;
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [localErrors, setLocalErrors] = useState({});
  
  // Get Stripe context
  const { 
    clientSecret, 
    createPaymentIntent, 
    paymentStatus, 
    paymentError 
  } = useStripeContext();

  // Trying to prevent radio submission
  useEffect(() => {
    // Function to prevent form submission when changing radio buttons
    const preventFormSubmission = (e) => {
      if (e.target.type === 'radio' && e.target.name === 'paymentMethod') {
        e.preventDefault();
      }
    };

    // Prevent form submission for radio buttons within the payment methods
    document.addEventListener('submit', preventFormSubmission);

    return () => {
      document.removeEventListener('submit', preventFormSubmission);
    };
  }, []);
  
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
  
  // Expose validation function to parent via ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      const errors = {};
      
      // Only validate credit card data if credit card is the selected payment method
      if (paymentMethod === 'credit-card') {
        // Validate card number (simplified for demo)
        if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 16) {
          errors.cardNumber = 'Numéro de carte invalide';
        }
        
        // Validate card name
        if (!cardData.cardName || cardData.cardName.trim() === '') {
          errors.cardName = 'Nom sur la carte requis';
        }
        
        // Validate expiry date
        if (!cardData.expiryDate || !cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
          errors.expiryDate = 'Date d\'expiration invalide (MM/YY)';
        }
        
        // Validate CVV
        if (!cardData.cvv || !cardData.cvv.match(/^\d{3,4}$/)) {
          errors.cvv = 'CVV invalide';
        }
      }
      
      // For Stripe, we rely on Stripe Elements validation
      
      setLocalErrors(errors);
      return { hasErrors: Object.keys(errors).length > 0, errors };
    },
    getFirstErrorElement: () => {
      return document.querySelector(`.${styles.paymentGateway} .${styles.inputError}`);
    },
    // Add a method to get the current payment method
    getPaymentMethod: () => paymentMethod
  }));
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => (event) => {
    // Prevent any default form submission
    event.preventDefault();

    setPaymentMethod(method);

    // Clear credit card errors when switching away from credit card payment
    if (method !== 'credit-card') {
      setLocalErrors({});
    }

    onPaymentDataChange({ method });
  };
  
  // Handle card data change
  const handleCardDataChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '') // Remove existing spaces
        .replace(/(.{4})/g, '$1 ') // Add space after every 4 chars
        .trim(); // Remove trailing space
    } 
    // Format expiry date as MM/YY
    else if (name === 'expiryDate') {
      const clean = value.replace(/\D/g, '');
      
      if (clean.length > 2) {
        formattedValue = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
      } else {
        formattedValue = clean;
      }
    }
    
    setCardData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear validation error when field is changed
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Notify parent of payment data change
    onPaymentDataChange({ 
      method: paymentMethod, 
      ...cardData, 
      [name]: formattedValue 
    });
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
    </div>
      
      {paymentMethod === 'stripe' && (
        <div className={styles.stripeContainer}>
          {clientSecret ? (
            <StripePaymentWrapper
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
