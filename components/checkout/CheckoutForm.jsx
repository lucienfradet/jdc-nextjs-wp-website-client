"use client";

import { useState, useEffect } from 'react';
import styles from '@/styles/checkout/CheckoutForm.module.css';

export default function CheckoutForm({ 
  cart, 
  pointDeChute, 
  hasShippableItems,
  onFormDataChange,
  onDeliveryMethodChange,
  validationErrors = {}
}) {
  const [formData, setFormData] = useState({
    // Delivery method options
    deliveryMethod: hasShippableItems ? 'shipping' : 'pickup', // Default to shipping if there are shippable items
    
    // Billing info
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    billingPhone: '',
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingState: '',
    billingPostcode: '',
    billingCountry: 'CA',
    
    // Shipping info (only used if deliveryMethod is 'shipping')
    shippingSameAsBilling: true,
    shippingFirstName: '',
    shippingLastName: '',
    shippingAddress1: '',
    shippingAddress2: '',
    shippingCity: '',
    shippingState: '',
    shippingPostcode: '',
    shippingCountry: 'CA',
    
    // Pickup location (used if cart has items with shipping_class="only_pickup" or deliveryMethod is 'pickup')
    selectedPickupLocation: ''
  });

  // Check if cart has pickup-only items
  const hasPickupOnlyItems = cart.some(item => item.shipping_class === 'only_pickup');

  // When form data changes, pass it up to parent
  useEffect(() => {
    onFormDataChange(formData);
  }, [formData, onFormDataChange]);

  // When delivery method changes, notify parent for shipping cost calculation
  useEffect(() => {
    if (onDeliveryMethodChange) {
      onDeliveryMethodChange(formData.deliveryMethod);
    }
  }, [formData.deliveryMethod, onDeliveryMethodChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If delivery method changes
      if (name === 'deliveryMethod') {
        // Do nothing special, just update the value
      }
      
      // If user checked "shipping same as billing", copy billing address to shipping
      if (name === 'shippingSameAsBilling') {
        if (e.target.checked) {
          newData.shippingFirstName = newData.billingFirstName;
          newData.shippingLastName = newData.billingLastName;
          newData.shippingAddress1 = newData.billingAddress1;
          newData.shippingAddress2 = newData.billingAddress2;
          newData.shippingCity = newData.billingCity;
          newData.shippingState = newData.billingState;
          newData.shippingPostcode = newData.billingPostcode;
          newData.shippingCountry = newData.billingCountry;
        }
      }
      
      // If billing address changes and "shipping same as billing" is checked,
      // update shipping address too
      if (name.startsWith('billing') && formData.shippingSameAsBilling) {
        const shippingField = name.replace('billing', 'shipping');
        if (shippingField in newData) {
          newData[shippingField] = value;
        }
      }
      
      return newData;
    });
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const renderDeliveryOptions = () => {
    // If there are no shippable items, don't show options (pickup is the only choice)
    if (!hasShippableItems) return null;

    return (
      <div className={styles.deliveryOptions}>
        <h3>Méthode de livraison</h3>
        
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="deliveryMethod"
              value="shipping"
              checked={formData.deliveryMethod === 'shipping'}
              onChange={handleInputChange}
            />
            <span className={styles.radioButton}></span>
            <span>Expédition à mon adresse</span>
          </label>
          
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              checked={formData.deliveryMethod === 'pickup'}
              onChange={handleInputChange}
            />
            <span className={styles.radioButton}></span>
            <span>Collecte à un point de chute</span>
          </label>
        </div>
      </div>
    );
  };

  const renderPickupLocationSelector = () => {
    // Only show pickup selector if there are pickup-only items OR if pickup is selected as delivery method
    if ((!hasPickupOnlyItems && formData.deliveryMethod !== 'pickup') || !pointDeChute || pointDeChute.length === 0) {
      return null;
    }
    
    return (
      <div className={styles.pickupSection}>
        <h3>Point de chute</h3>
        <p>Veuillez sélectionner un point de chute pour récupérer vos produits</p>
        
        <div className={styles.formGroup}>
          <label htmlFor="selectedPickupLocation">Point de chute:</label>
          <select
            id="selectedPickupLocation"
            name="selectedPickupLocation"
            value={formData.selectedPickupLocation}
            onChange={handleInputChange}
            className={validationErrors.selectedPickupLocation ? styles.inputError : ''}
          >
            <option value="">-- Sélectionner un point de chute --</option>
            {pointDeChute.map(point => (
              <option key={point.id} value={point.id}>
                {point.location_name}
              </option>
            ))}
          </select>
          {validationErrors.selectedPickupLocation && (
            <p className={styles.errorText}>{validationErrors.selectedPickupLocation}</p>
          )}
        </div>
        
        {/* Show selected pickup location details */}
        {formData.selectedPickupLocation && (
          <div className={styles.pickupDetails}>
            {pointDeChute.filter(point => point.id.toString() === formData.selectedPickupLocation.toString()).map(point => (
              <div key={point.id}>
                <h4>{point.location_name}</h4>
                <p>{point.adresse.adresse}</p>
                <p>{point.adresse.code_postale} {point.adresse.city}</p>
                <p>{point.adresse.province}, {point.adresse.pays}</p>
                {point.description_instructions && (
                  <div className={styles.instructions}>
                    <h5>Instructions:</h5>
                    <p>{point.description_instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.checkoutForm}>
      {/* Delivery Method Selection */}
      {renderDeliveryOptions()}

      {/* Billing Information */}
      <section className={styles.formSection}>
        <h3>Informations de facturation</h3>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="billingFirstName">Prénom</label>
            <input
              type="text"
              id="billingFirstName"
              name="billingFirstName"
              value={formData.billingFirstName}
              onChange={handleInputChange}
              className={validationErrors.billingFirstName ? styles.inputError : ''}
            />
            {validationErrors.billingFirstName && (
              <p className={styles.errorText}>{validationErrors.billingFirstName}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="billingLastName">Nom</label>
            <input
              type="text"
              id="billingLastName"
              name="billingLastName"
              value={formData.billingLastName}
              onChange={handleInputChange}
              className={validationErrors.billingLastName ? styles.inputError : ''}
            />
            {validationErrors.billingLastName && (
              <p className={styles.errorText}>{validationErrors.billingLastName}</p>
            )}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="billingEmail">Courriel</label>
            <input
              type="email"
              id="billingEmail"
              name="billingEmail"
              value={formData.billingEmail}
              onChange={handleInputChange}
              className={validationErrors.billingEmail ? styles.inputError : ''}
            />
            {validationErrors.billingEmail && (
              <p className={styles.errorText}>{validationErrors.billingEmail}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="billingPhone">Téléphone</label>
            <input
              type="tel"
              id="billingPhone"
              name="billingPhone"
              value={formData.billingPhone}
              onChange={handleInputChange}
              className={validationErrors.billingPhone ? styles.inputError : ''}
            />
            {validationErrors.billingPhone && (
              <p className={styles.errorText}>{validationErrors.billingPhone}</p>
            )}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="billingAddress1">Adresse</label>
          <input
            type="text"
            id="billingAddress1"
            name="billingAddress1"
            value={formData.billingAddress1}
            onChange={handleInputChange}
            className={validationErrors.billingAddress1 ? styles.inputError : ''}
          />
          {validationErrors.billingAddress1 && (
            <p className={styles.errorText}>{validationErrors.billingAddress1}</p>
          )}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="billingAddress2">Appartement, suite, etc. (optionnel)</label>
          <input
            type="text"
            id="billingAddress2"
            name="billingAddress2"
            value={formData.billingAddress2}
            onChange={handleInputChange}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="billingCity">Ville</label>
            <input
              type="text"
              id="billingCity"
              name="billingCity"
              value={formData.billingCity}
              onChange={handleInputChange}
              className={validationErrors.billingCity ? styles.inputError : ''}
            />
            {validationErrors.billingCity && (
              <p className={styles.errorText}>{validationErrors.billingCity}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="billingState">Province</label>
            <select
              id="billingState"
              name="billingState"
              value={formData.billingState}
              onChange={handleInputChange}
              className={validationErrors.billingState ? styles.inputError : ''}
            >
              <option value="">-- Sélectionner --</option>
              <option value="QC">Québec</option>
              <option value="ON">Ontario</option>
              <option value="NS">Nouvelle-Écosse</option>
              <option value="NB">Nouveau-Brunswick</option>
              <option value="MB">Manitoba</option>
              <option value="BC">Colombie-Britannique</option>
              <option value="PE">Île-du-Prince-Édouard</option>
              <option value="SK">Saskatchewan</option>
              <option value="AB">Alberta</option>
              <option value="NL">Terre-Neuve-et-Labrador</option>
              <option value="NT">Territoires du Nord-Ouest</option>
              <option value="YT">Yukon</option>
              <option value="NU">Nunavut</option>
            </select>
            {validationErrors.billingState && (
              <p className={styles.errorText}>{validationErrors.billingState}</p>
            )}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="billingPostcode">Code postal</label>
            <input
              type="text"
              id="billingPostcode"
              name="billingPostcode"
              value={formData.billingPostcode}
              onChange={handleInputChange}
              className={validationErrors.billingPostcode ? styles.inputError : ''}
            />
            {validationErrors.billingPostcode && (
              <p className={styles.errorText}>{validationErrors.billingPostcode}</p>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="billingCountry">Pays</label>
            <select
              id="billingCountry"
              name="billingCountry"
              value={formData.billingCountry}
              onChange={handleInputChange}
              className={validationErrors.billingCountry ? styles.inputError : ''}
            >
              <option value="CA">Canada</option>
            </select>
            {validationErrors.billingCountry && (
              <p className={styles.errorText}>{validationErrors.billingCountry}</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Shipping Information (only if deliveryMethod is 'shipping') */}
      {hasShippableItems && formData.deliveryMethod === 'shipping' && (
        <section className={styles.formSection}>
          <h3>Informations de livraison</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="shippingSameAsBilling"
                checked={formData.shippingSameAsBilling}
                onChange={(e) => handleInputChange({
                  target: {
                    name: 'shippingSameAsBilling',
                    value: e.target.checked
                  }
                })}
              />
              L'adresse de livraison est la même que l'adresse de facturation
            </label>
          </div>
          
          {!formData.shippingSameAsBilling && (
            <>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="shippingFirstName">Prénom</label>
                  <input
                    type="text"
                    id="shippingFirstName"
                    name="shippingFirstName"
                    value={formData.shippingFirstName}
                    onChange={handleInputChange}
                    className={validationErrors.shippingFirstName ? styles.inputError : ''}
                  />
                  {validationErrors.shippingFirstName && (
                    <p className={styles.errorText}>{validationErrors.shippingFirstName}</p>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="shippingLastName">Nom</label>
                  <input
                    type="text"
                    id="shippingLastName"
                    name="shippingLastName"
                    value={formData.shippingLastName}
                    onChange={handleInputChange}
                    className={validationErrors.shippingLastName ? styles.inputError : ''}
                  />
                  {validationErrors.shippingLastName && (
                    <p className={styles.errorText}>{validationErrors.shippingLastName}</p>
                  )}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="shippingAddress1">Adresse</label>
                <input
                  type="text"
                  id="shippingAddress1"
                  name="shippingAddress1"
                  value={formData.shippingAddress1}
                  onChange={handleInputChange}
                  className={validationErrors.shippingAddress1 ? styles.inputError : ''}
                />
                {validationErrors.shippingAddress1 && (
                  <p className={styles.errorText}>{validationErrors.shippingAddress1}</p>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="shippingAddress2">Appartement, suite, etc. (optionnel)</label>
                <input
                  type="text"
                  id="shippingAddress2"
                  name="shippingAddress2"
                  value={formData.shippingAddress2}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="shippingCity">Ville</label>
                  <input
                    type="text"
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    className={validationErrors.shippingCity ? styles.inputError : ''}
                  />
                  {validationErrors.shippingCity && (
                    <p className={styles.errorText}>{validationErrors.shippingCity}</p>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="shippingState">Province</label>
                  <select
                    id="shippingState"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    className={validationErrors.shippingState ? styles.inputError : ''}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="QC">Québec</option>
                    <option value="ON">Ontario</option>
                    <option value="NS">Nouvelle-Écosse</option>
                    <option value="NB">Nouveau-Brunswick</option>
                    <option value="MB">Manitoba</option>
                    <option value="BC">Colombie-Britannique</option>
                    <option value="PE">Île-du-Prince-Édouard</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="AB">Alberta</option>
                    <option value="NL">Terre-Neuve-et-Labrador</option>
                    <option value="NT">Territoires du Nord-Ouest</option>
                    <option value="YT">Yukon</option>
                    <option value="NU">Nunavut</option>
                  </select>
                  {validationErrors.shippingState && (
                    <p className={styles.errorText}>{validationErrors.shippingState}</p>
                  )}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="shippingPostcode">Code postal</label>
                  <input
                    type="text"
                    id="shippingPostcode"
                    name="shippingPostcode"
                    value={formData.shippingPostcode}
                    onChange={handleInputChange}
                    className={validationErrors.shippingPostcode ? styles.inputError : ''}
                  />
                  {validationErrors.shippingPostcode && (
                    <p className={styles.errorText}>{validationErrors.shippingPostcode}</p>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="shippingCountry">Pays</label>
                  <select
                    id="shippingCountry"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleInputChange}
                    className={validationErrors.shippingCountry ? styles.inputError : ''}
                  >
                    <option value="CA">Canada</option>
                  </select>
                  {validationErrors.shippingCountry && (
                    <p className={styles.errorText}>{validationErrors.shippingCountry}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}
      
      {/* Pickup Point Selection (if needed) */}
      {renderPickupLocationSelector()}
    </div>
  );
}
