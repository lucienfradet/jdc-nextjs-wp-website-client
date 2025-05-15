"use client";

import styles from '@/styles/checkout/CheckoutForm.module.css';

const EmailConfirmation = ({ 
  formData, 
  setFormData, 
  localErrors, 
  setLocalErrors 
}) => {
  // Check if emails match when either field changes or during validation
  const validateEmails = () => {
    if (formData.billingEmail && formData.billingConfirmEmail && 
      formData.billingEmail !== formData.billingConfirmEmail) {
      setLocalErrors(prev => ({
        ...prev,
        billingConfirmEmail: 'Les adresses courriels ne correspondent pas'
      }));
    } else if (localErrors.billingConfirmEmail && 
      formData.billingEmail === formData.billingConfirmEmail) {
      // Clear the error if they now match
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.billingConfirmEmail;
        return newErrors;
      });
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is changed
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label htmlFor="billingEmail">Courriel</label>
        <input
          type="email"
          id="billingEmail"
          name="billingEmail"
          value={formData.billingEmail}
          onChange={handleInputChange}
          onBlur={() => {
            if (formData.billingConfirmEmail) {
              validateEmails();
            }
          }}
          className={localErrors.billingEmail ? styles.inputError : ''}
        />
        {localErrors.billingEmail && (
          <p className={styles.errorText}>{localErrors.billingEmail}</p>
        )}
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="billingConfirmEmail">Confirmer votre adresse courriel</label>
        <input
          type="email"
          id="billingConfirmEmail"
          name="billingConfirmEmail"
          value={formData.billingConfirmEmail || ''}
          onChange={handleInputChange}
          onBlur={validateEmails}
          className={localErrors.billingConfirmEmail ? styles.inputError : ''}
        />
        {localErrors.billingConfirmEmail && (
          <p className={styles.errorText}>{localErrors.billingConfirmEmail}</p>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
