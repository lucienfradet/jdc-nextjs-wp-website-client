"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import EmailConfirmation from '../EmailConfirmation';
import styles from '@/styles/checkout/CheckoutForm.module.css';

const CheckoutForm = forwardRef(({ 
  cart, 
  pointDeChute, 
  paymentMethod,
  hasShippableItems,
  onFormDataChange,
  onDeliveryMethodChange,
  onProvinceChange,
  savedFormData
}, ref) => {
    const [formData, setFormData] = useState(() => {
      // Initialize with saved form data if available, otherwise use defaults
      if (savedFormData) {
        return savedFormData;
      }

      return {
        // Delivery method options
        deliveryMethod: hasShippableItems ? 'shipping' : 'pickup', // Default to shipping if there are shippable items

        // Billing info
        billingFirstName: '',
        billingLastName: '',
        billingEmail: '',
        billingConfirmEmail: '',
        billingPhone: '',
        billingAddress1: '',
        billingAddress2: '',
        billingCity: '',
        billingState: '',
        billingPostcode: '',
        billingCountry: 'CA',

        // Shipping info (only used if deliveryMethod is 'shipping')
        shippingSameAsBilling: true,
        shippingAddress1: '',
        shippingAddress2: '',
        shippingCity: '',
        shippingState: '',
        shippingPostcode: '',
        shippingCountry: 'CA',

        // Pickup location (used if cart has items with shipping_class="only_pickup" or deliveryMethod is 'pickup')
        selectedPickupLocation: '',
        selectedPickupLocationName: ''
      }
    });

    const [localErrors, setLocalErrors] = useState({});

    // Check if cart has pickup-only items
    const hasPickupOnlyItems = cart.some(item => item.shipping_class === 'only_pickup');
    // Check if ALL items are pickup-only
    const isPickupOnlyOrder = cart.every(item => item.shipping_class === 'only_pickup');

    // Expose validation function to parent via ref
    useImperativeHandle(ref, () => ({
      validate: () => {
        const errors = {};

        // For all orders, always validate these fields
        ['billingFirstName', 'billingLastName', 'billingEmail', 'billingConfirmEmail', 'billingPhone'].forEach(field => {
          if (!formData[field]) {
            errors[field] = 'Ce champ est requis';
          }
        });

        // Check if emails match
        if (formData.billingEmail && formData.billingConfirmEmail && 
          formData.billingEmail !== formData.billingConfirmEmail) {
          errors.billingConfirmEmail = 'Les adresses e-mail ne correspondent pas';
        }

        // Only validate address if we have shippable items
        if (!isPickupOnlyOrder) {
          // Validate billing address
          ['billingAddress1', 'billingCity', 'billingState', 'billingPostcode'].forEach(field => {
            if (!formData[field]) {
              errors[field] = 'Ce champ est requis';
            }
          });

          // Validate shipping address if shipping is selected and "same as billing" is not checked
          if (hasShippableItems && formData.deliveryMethod === 'shipping' && !formData.shippingSameAsBilling) {
            ['shippingAddress1', 'shippingCity', 'shippingState', 'shippingPostcode'].forEach(field => {
                if (!formData[field]) {
                  errors[field] = 'Ce champ est requis';
                }
              });
          }
        }

        // Validate pickup location if we have pickup-only items or if delivery method is pickup
        if ((hasPickupOnlyItems || formData.deliveryMethod === 'pickup') && !formData.selectedPickupLocation) {
          errors.selectedPickupLocation = 'Veuillez sélectionner un point de chute';
        }

        setLocalErrors(errors);
        return { hasErrors: Object.keys(errors).length > 0, errors };
      },
      getFirstErrorElement: () => {
        return document.querySelector(`.${styles.checkoutForm} .${styles.inputError}`);
      }
    }));

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

        // If province changes, update the tax calculation
        if (name === 'billingState' && onProvinceChange) {
          onProvinceChange(value);
        }

        // If delivery method changes
        if (name === 'deliveryMethod') {
          // Do nothing special, just update the value
        }

        // If user checked "shipping same as billing", copy billing address to shipping
        if (name === 'shippingSameAsBilling') {
          if (e.target.checked) {
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

        // Update selectedPickupLocationName when selectedPickupLocation changes
        if (name === 'selectedPickupLocation') {
          const selectedPoint = pointDeChute.find(point => point.id.toString() === value);
          if (selectedPoint) {
            newData.selectedPickupLocationName = selectedPoint.location_name;
          }
        }

        return newData;
      });

      // Clear validation error when field is changed
      if (localErrors[name]) {
        setLocalErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    };

    const renderDeliveryOptions = () => {
      // If there are no shippable items or all items are pickup-only, don't show options
      if (!hasShippableItems || isPickupOnlyOrder) return null;

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
        <div 
          className={styles.pickupSection}
          style={paymentMethod !== "stripe" ? { marginTop: "0px" } : {}}
        >
          <h3>Point de chute</h3>

          {
            paymentMethod === "stripe" ? (
              formData.deliveryMethod === "pickup" ? (
                <p>Veuillez sélectionner un point de chute pour récupérer vos produits</p>
              ) : (
                  <p>Veuillez sélectionner un point de chute pour les articles
                    de votre panier qui sont offert <strong>uniquement en cueillette</strong></p>
                )
            ) : (
                <p>Voici nos point de chutes disponnible pour la ceuilette</p>
              )
          }

          <div className={styles.formGroup}>
            <label htmlFor="selectedPickupLocation">Point de chute:</label>
            <select
              id="selectedPickupLocation"
              name="selectedPickupLocation"
              value={formData.selectedPickupLocation}
              onChange={handleInputChange}
              className={localErrors.selectedPickupLocation ? styles.inputError : ''}
            >
              <option value="">-- Sélectionner un point de chute --</option>
              {pointDeChute.map(point => (
                <option key={point.id} value={point.id}>
                  {point.location_name}
                </option>
              ))}
            </select>
            {localErrors.selectedPickupLocation && (
              <p className={styles.errorText}>{localErrors.selectedPickupLocation}</p>
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

    const renderFormInputs = () => {
    {/* Render the complete form only if stripe is selected */}
      if (paymentMethod !== "stripe") {
        return null;
      }

      return (
        <>
          {/* Delivery Method Selection */}
          {renderDeliveryOptions()}

          {/* Billing Information */}
          <section className={styles.formSection}>
            <h3>Coordonnées de contact</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="billingFirstName">Prénom</label>
                <input
                  type="text"
                  id="billingFirstName"
                  name="billingFirstName"
                  value={formData.billingFirstName}
                  onChange={handleInputChange}
                  className={localErrors.billingFirstName ? styles.inputError : ''}
                />
                {localErrors.billingFirstName && (
                  <p className={styles.errorText}>{localErrors.billingFirstName}</p>
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
                  className={localErrors.billingLastName ? styles.inputError : ''}
                />
                {localErrors.billingLastName && (
                  <p className={styles.errorText}>{localErrors.billingLastName}</p>
                )}
              </div>
            </div>

            <EmailConfirmation
              formData={formData}
              setFormData={setFormData}
              localErrors={localErrors}
              setLocalErrors={setLocalErrors}
            />

            <div className={styles.formGroup}>
              <label htmlFor="billingPhone">Téléphone</label>
              <input
                type="tel"
                id="billingPhone"
                name="billingPhone"
                value={formData.billingPhone}
                onChange={handleInputChange}
                className={localErrors.billingPhone ? styles.inputError : ''}
              />
              {localErrors.billingPhone && (
                <p className={styles.errorText}>{localErrors.billingPhone}</p>
              )}
            </div>
          </section>

          {/* Only show address fields if this is not a pickup-only order */}
          {!isPickupOnlyOrder && formData.deliveryMethod !== 'pickup' && (
            <section className={styles.formSection}>
              <h3>Informations de facturation</h3>

              <div className={styles.formGroup}>
                <label htmlFor="billingAddress1">Adresse</label>
                <input
                  type="text"
                  id="billingAddress1"
                  name="billingAddress1"
                  value={formData.billingAddress1}
                  onChange={handleInputChange}
                  className={localErrors.billingAddress1 ? styles.inputError : ''}
                />
                {localErrors.billingAddress1 && (
                  <p className={styles.errorText}>{localErrors.billingAddress1}</p>
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
                    className={localErrors.billingCity ? styles.inputError : ''}
                  />
                  {localErrors.billingCity && (
                    <p className={styles.errorText}>{localErrors.billingCity}</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="billingState">Province</label>
                  <select
                    id="billingState"
                    name="billingState"
                    value={formData.billingState}
                    onChange={handleInputChange}
                    className={localErrors.billingState ? styles.inputError : ''}
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
                  {localErrors.billingState && (
                    <p className={styles.errorText}>{localErrors.billingState}</p>
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
                    className={localErrors.billingPostcode ? styles.inputError : ''}
                  />
                  {localErrors.billingPostcode && (
                    <p className={styles.errorText}>{localErrors.billingPostcode}</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="billingCountry">Pays</label>
                  <select
                    id="billingCountry"
                    name="billingCountry"
                    value={formData.billingCountry}
                    onChange={handleInputChange}
                    className={localErrors.billingCountry ? styles.inputError : ''}
                  >
                    <option value="CA">Canada</option>
                  </select>
                  {localErrors.billingCountry && (
                    <p className={styles.errorText}>{localErrors.billingCountry}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Shipping Information (only if deliveryMethod is 'shipping' and NOT a pickup-only order) */}
          {hasShippableItems && formData.deliveryMethod === 'shipping' && !isPickupOnlyOrder && (
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
                  L&apos;adresse de livraison est la même que l&apos;adresse de facturation
                </label>
              </div>

              {!formData.shippingSameAsBilling && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="shippingAddress1">Adresse</label>
                    <input
                      type="text"
                      id="shippingAddress1"
                      name="shippingAddress1"
                      value={formData.shippingAddress1}
                      onChange={handleInputChange}
                      className={localErrors.shippingAddress1 ? styles.inputError : ''}
                    />
                    {localErrors.shippingAddress1 && (
                      <p className={styles.errorText}>{localErrors.shippingAddress1}</p>
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
                        className={localErrors.shippingCity ? styles.inputError : ''}
                      />
                      {localErrors.shippingCity && (
                        <p className={styles.errorText}>{localErrors.shippingCity}</p>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="shippingState">Province</label>
                      <select
                        id="shippingState"
                        name="shippingState"
                        value={formData.shippingState}
                        onChange={handleInputChange}
                        className={localErrors.shippingState ? styles.inputError : ''}
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
                      {localErrors.shippingState && (
                        <p className={styles.errorText}>{localErrors.shippingState}</p>
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
                        className={localErrors.shippingPostcode ? styles.inputError : ''}
                      />
                      {localErrors.shippingPostcode && (
                        <p className={styles.errorText}>{localErrors.shippingPostcode}</p>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="shippingCountry">Pays</label>
                      <select
                        id="shippingCountry"
                        name="shippingCountry"
                        value={formData.shippingCountry}
                        onChange={handleInputChange}
                        className={localErrors.shippingCountry ? styles.inputError : ''}
                      >
                        <option value="CA">Canada</option>
                      </select>
                      {localErrors.shippingCountry && (
                        <p className={styles.errorText}>{localErrors.shippingCountry}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      );
    };

    return (
      <div className={styles.checkoutForm}>
        {renderFormInputs()}
        {renderPickupLocationSelector()}
      </div>
    );
  });

CheckoutForm.displayName = 'CheckoutForm';

export default CheckoutForm;
