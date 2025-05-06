"use client";

import styles from '@/styles/checkout/PaymentGateway.module.css';
import { renderContent } from '@/lib/textUtils';

export default function PaymentSelector({ paymentMethod, onPaymentMethodChange, checkoutPageContent }) {
  // Handle payment method change
  const handlePaymentMethodChange = (method) => (event) => {
    // Prevent any default form submission
    event.preventDefault();
    onPaymentMethodChange(method);
  };
  
  return (
    <div className={styles.paymentGateway}>
      <h3>Méthode de paiement</h3>
      
      <div className={styles.paymentMethods}>
        <label 
          className={`${styles.paymentMethod} ${paymentMethod === 'bank-transfer' ? styles.selected : ''}`}
        >
          <input
            type="radio"
            name="paymentMethod"
            checked={paymentMethod === 'bank-transfer'}
            onChange={handlePaymentMethodChange('bank-transfer')}
          />
          <span className={styles.radioButton}></span>
          <span className={styles.methodName}>Virement bancaire (Instructions à suivre)</span>
        </label>

        <label 
          className={`${styles.paymentMethod} ${paymentMethod === 'stripe' ? styles.selected : ''}`}
        >
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
      
      {paymentMethod === 'bank-transfer' && (
        <div className={styles.bankTransferInfo}>
          {renderContent(checkoutPageContent["paiment-interac-explication"])}
        </div>
      )}
    </div>
  );
}
