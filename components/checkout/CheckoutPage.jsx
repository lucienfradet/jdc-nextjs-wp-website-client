"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/checkout/CheckoutPage.module.css';
import { useCart } from '@/context/CartContext';
import { useCsrf } from '@/context/CsrfContext';
import { useNavigation } from '@/context/NavigationContext';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import PaymentSelector from '@/components/checkout/PaymentSelector';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";

export default function CheckoutPage({ 
  headerData,
  footerData,
  siteIconUrl,
  checkoutPageContent,
  pointDeChute
}) {
  const router = useRouter();
  const { startNavigation } = useNavigation();
  const [isMobile, setIsMobile] = useState(false);
  const { 
    cart, 
    getCartTotal, 
    taxError, 
    canCheckout, 
    updateProvince, 
    updateDeliveryMethod 
  } = useCart();
  const { csrfToken, isLoading: csrfLoading } = useCsrf();
  const [hasShippableItems, setHasShippableItems] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  // Load payment method from sessionStorage or use default
  const [paymentMethod, setPaymentMethod] = useState(() => {
    // Try to get saved payment method, default to 'bank-transfer' if not found
    try {
      const savedMethod = sessionStorage.getItem('checkoutPaymentMethod');
      return savedMethod || 'bank-transfer';
    } catch (error) {
      console.log('Error accessing sessionStorage:', error);
      return 'bank-transfer';
    }
  });

  // Add state to store saved form data
  const [savedFormData, setSavedFormData] = useState(null);
  const [isFormDataLoaded, setIsFormDataLoaded] = useState(false);

  // Create refs for the child components
  const checkoutFormRef = useRef(null);
  
  // Check if cart is empty, redirect to home if it is
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
    
    // Check if we have any non-booking shippable items
    const hasShippable = cart.some(item => 
      item.shipping_class !== 'only_pickup' && item.type !== 'mwb_booking'
    );
    setHasShippableItems(hasShippable);
    
  }, [cart, router, getCartTotal]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991); // Define breakpoint for mobile/tablet
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Load saved form data from session storage on mount
  useEffect(() => {
    const loadSavedFormData = () => {
      try {
        const storedFormData = sessionStorage.getItem('checkoutFormData');
        if (storedFormData) {
          setSavedFormData(JSON.parse(storedFormData));
        }
        setIsFormDataLoaded(true);
      } catch (error) {
        console.error('Error loading saved form data:', error);
        setIsFormDataLoaded(true); // Mark as loaded even if there's an error
      }
    };
    
    loadSavedFormData();
  }, []);

  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    // This is the key change - update CartContext immediately
    updateDeliveryMethod(method);
  }

  // Handle form data change
  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  // Handle province change
  const handleProvinceChange = (province) => {
    if (province) {
      updateProvince(province);
    }
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    
    // Save the selected payment method to sessionStorage
    try {
      sessionStorage.setItem('checkoutPaymentMethod', method);
    } catch (error) {
      console.error('Error saving payment method to sessionStorage:', error);
    }
  };
  
  // Focus on the first error element
  const focusOnFirstError = () => {
    // Check if checkout form component has errors
    const checkoutFormElement = checkoutFormRef.current?.getFirstErrorElement();
    
    // Focus on the first error element found
    if (checkoutFormElement) {
      checkoutFormElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      checkoutFormElement.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if CSRF token is ready
    if (csrfLoading || !csrfToken) {
      setFormErrors({
        submission: 'Veuillez patienter pendant que nous sécurisons votre session.'
      });
      return;
    }
    
    // Check if checkout is allowed (no tax errors)
    if (!canCheckout()) {
      setFormErrors({
        submission: 'Le calcul des taxes a échoué. Impossible de finaliser la commande.'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    if (paymentMethod === 'bank-transfer') {
      return;
    }
    
    // For credit card payments, we need to validate the form
    // Validate checkout form
    const checkoutFormValidation = await checkoutFormRef.current.validate();
    
    // If we have errors, stop submission
    if (checkoutFormValidation.hasErrors) {
      setFormErrors(checkoutFormValidation.errors);
      setIsSubmitting(false);
      
      // Focus on the first error element
      focusOnFirstError();
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    try {
      // Store the form data in session storage to access on the payment page
      sessionStorage.setItem('checkoutFormData', JSON.stringify(formData));
      sessionStorage.setItem('checkoutPaymentMethod', paymentMethod);
      sessionStorage.setItem('deliveryMethod', deliveryMethod);
      sessionStorage.setItem('csrfToken', csrfToken); // Store CSRF token
      
      // Redirect to the payment page
      startNavigation();
      router.push('/payment');
    } catch (error) {
      console.error('Error processing form:', error);
      setFormErrors({
        submission: error.message || 'Une erreur est survenue lors du traitement de votre commande'
      });
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return <div className={styles.emptyCart}>Votre panier est vide</div>;
  }

  return (
    <>
      <CustomHead
        title="Paiement - Le Jardin des chefs"
        description="Complétez votre commande"
        canonicalUrl={process.env.NEXT_PUBLIC_SITE_URL + '/checkout'}
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.checkoutContainer}>
        <h1 className={styles.pageTitle}>Finaliser votre commande</h1>

        {/* Tax error alert banner */}
        {taxError && (
          <div className={styles.taxErrorAlert || 'error-alert'}>
            <strong>Attention:</strong> Nous n&apos;avons pas pu calculer les taxes pour votre commande. 
            Veuillez réessayer ultérieurement ou contacter notre service client pour obtenir de l&apos;aide.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.checkoutForm}>
          {/* Add hidden CSRF token input */}
          <input type="hidden" name="csrf_token" value={csrfToken || ''} />
          
          <div className={styles.checkoutColumns}>
            <div className={styles.formColumn}>
              {/* Payment Method Selection - Moved to the top */}
              <PaymentSelector 
                paymentMethod={paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                checkoutPageContent={checkoutPageContent.acfFields}
              />

              {isFormDataLoaded && (
                <CheckoutForm 
                  ref={checkoutFormRef}
                  cart={cart} 
                  paymentMethod={paymentMethod}
                  pointDeChute={pointDeChute} 
                  hasShippableItems={hasShippableItems}
                  onFormDataChange={handleFormDataChange}
                  onDeliveryMethodChange={handleDeliveryMethodChange}
                  onProvinceChange={handleProvinceChange}
                  savedFormData={savedFormData}
                />
              )}

              <div className={styles.submitSection}>
                {paymentMethod === 'bank-transfer' ? (
                  <div className={styles.bankTransferNote}>
                    <p>Pour le paiement par virement bancaire, veuillez noter les instructions ci-dessus et nous contacter par courriel.</p>
                    <a href="mailto:contact@jardindeschefs.com" className={styles.emailLink}>
                      Contactez-nous par courriel
                    </a>
                  </div>
                ) : (
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isSubmitting || !canCheckout() || csrfLoading}
                  >
                    {isSubmitting ? 'Traitement en cours...' : (csrfLoading ? 'Sécurisation...' : 'Confirmer la commande')}
                  </button>
                )}

                {/* Display message when checkout is disabled due to tax error */}
                {taxError && (
                  <div className={styles.taxErrorMessage || 'error-message'}>
                      Le calcul des taxes a échoué.<br />
                      La finalisation de la commande n&apos;est pas disponible pour le moment.
                  </div>
                )}

                {Object.keys(formErrors).length > 0 && (
                  <div className={styles.formErrorSummary}>
                    Veuillez corriger les erreurs dans le formulaire pour continuer.
                    {formErrors.submission && (
                      <p className={styles.submissionError}>{formErrors.submission}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.summaryColumn}>
              <OrderSummary 
                hideModifyCart={true}
              />
            </div>
          </div>
        </form>
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
