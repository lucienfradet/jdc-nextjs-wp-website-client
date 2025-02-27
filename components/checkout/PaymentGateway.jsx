"use client";

import { useState, useEffect } from 'react';
import styles from '@/styles/checkout/PaymentGateway.module.css';

export default function PaymentGateway({ onPaymentDataChange, validationErrors = {} }) {
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [localErrors, setLocalErrors] = useState({});
  
  // Sync with parent errors when they change
  useEffect(() => {
    // If parent has validation errors for our fields, show them in our UI
    const relevantErrors = {};
    ['cardNumber', 'cardName', 'expiryDate', 'cvv'].forEach(field => {
      if (validationErrors[field]) {
        relevantErrors[field] = validationErrors[field];
      }
    });
    
    if (Object.keys(relevantErrors).length > 0) {
      setLocalErrors(prev => ({ ...prev, ...relevantErrors }));
    }
  }, [validationErrors]);
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    onPaymentDataChange({ method, ...cardData });
  };
  
  // Handle card data change
  const handleCardDataChange = (e) => {
    const { name, value } = e.target;
    
    // Format card number with spaces every 4 digits
    if (name === 'cardNumber') {
      const formatted = value
        .replace(/\s/g, '') // Remove existing spaces
        .replace(/(.{4})/g, '$1 ') // Add space after every 4 chars
        .trim(); // Remove trailing space
      
      setCardData({ ...cardData, [name]: formatted });
    } 
    // Format expiry date as MM/YY
    else if (name === 'expiryDate') {
      const clean = value.replace(/\D/g, '');
      let formatted = clean;
      
      if (clean.length > 2) {
        formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
      }
      
      setCardData({ ...cardData, [name]: formatted });
    }
    // Regular input for other fields
    else {
      setCardData({ ...cardData, [name]: value });
    }
    
    // Clear validation error when field is changed
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Notify parent of payment data change
    onPaymentDataChange({ method: paymentMethod, ...cardData, [name]: value });
  };
  
  // Validate card data (can be called by the parent via a ref if needed)
  const validateCardData = () => {
    const newErrors = {};
    
    // Validate card number (simplified for demo)
    if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Numéro de carte invalide';
    }
    
    // Validate card name
    if (!cardData.cardName || cardData.cardName.trim() === '') {
      newErrors.cardName = 'Nom sur la carte requis';
    }
    
    // Validate expiry date
    if (!cardData.expiryDate || !cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      newErrors.expiryDate = 'Date d\'expiration invalide (MM/YY)';
    }
    
    // Validate CVV
    if (!cardData.cvv || !cardData.cvv.match(/^\d{3,4}$/)) {
      newErrors.cvv = 'CVV invalide';
    }
    
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return (
    <div className={styles.paymentGateway}>
      <h3>Méthode de paiement</h3>
      
      <div className={styles.paymentMethods}>
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
          <p>
            INCLURE INFO DE ABONNEMENT PAGE
          </p>
        </div>
      )}
    </div>
  );
}
