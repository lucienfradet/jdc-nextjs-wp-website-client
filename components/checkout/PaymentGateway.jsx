"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from '@/styles/checkout/PaymentGateway.module.css';
import { renderContent } from '@/lib/textUtils';

const PaymentGateway = forwardRef(({ onPaymentDataChange, abonnementPageData }, ref) => {
  const abonnementPageContent = abonnementPageData.acfFields;
  const [paymentMethod, setPaymentMethod] = useState('bank-transfer');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [localErrors, setLocalErrors] = useState({});
  
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
      
      setLocalErrors(errors);
      return { hasErrors: Object.keys(errors).length > 0, errors };
    },
    getFirstErrorElement: () => {
      return document.querySelector(`.${styles.paymentGateway} .${styles.inputError}`);
    }
  }));
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Clear credit card errors when switching away from credit card payment
    if (method !== 'credit-card') {
      setLocalErrors({});
    }
    
    onPaymentDataChange({ method, ...cardData });
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
  
  return (
    <div className={styles.paymentGateway}>
      <h3>Méthode de paiement</h3>
      
      <div className={styles.paymentMethods}>
        <label className={`${styles.paymentMethod} ${paymentMethod === 'bank-transfer' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'bank-transfer'}
            onChange={() => handlePaymentMethodChange('bank-transfer')}
          />
          <span className={styles.radioButton}></span>
          <span className={styles.methodName}>Virement bancaire (Instructions à suivre)</span>
        </label>

        <label className={`${styles.paymentMethod} ${paymentMethod === 'credit-card' ? styles.selected : ''}`}>
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'credit-card'}
            onChange={() => handlePaymentMethodChange('credit-card')}
          />
          <span className={styles.radioButton}></span>
          <span className={styles.methodName}>Carte de crédit</span>
        </label>
      </div>
      
      {paymentMethod === 'credit-card' && (
        <div className={styles.creditCardForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cardNumber">Numéro de carte</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardDataChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19" // 16 digits + 3 spaces
                className={localErrors.cardNumber ? styles.inputError : ''}
              />
              {localErrors.cardNumber && (
                <p className={styles.errorText}>{localErrors.cardNumber}</p>
              )}
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cardName">Nom sur la carte</label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                value={cardData.cardName}
                onChange={handleCardDataChange}
                placeholder="Prénom Nom"
                className={localErrors.cardName ? styles.inputError : ''}
              />
              {localErrors.cardName && (
                <p className={styles.errorText}>{localErrors.cardName}</p>
              )}
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="expiryDate">Date d'expiration</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={cardData.expiryDate}
                onChange={handleCardDataChange}
                placeholder="MM/YY"
                maxLength="5"
                className={localErrors.expiryDate ? styles.inputError : ''}
              />
              {localErrors.expiryDate && (
                <p className={styles.errorText}>{localErrors.expiryDate}</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={cardData.cvv}
                onChange={handleCardDataChange}
                placeholder="123"
                maxLength="4"
                className={localErrors.cvv ? styles.inputError : ''}
              />
              {localErrors.cvv && (
                <p className={styles.errorText}>{localErrors.cvv}</p>
              )}
            </div>
          </div>
          
          <div className={styles.securePaymentInfo}>
            <div className={styles.secureIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p>Paiement sécurisé par SSL</p>
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
