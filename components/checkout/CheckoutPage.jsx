"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/checkout/CheckoutPage.module.css';
import { useCart } from '@/context/CartContext';
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
  abonnementPageData,
  pointDeChute
}) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { cart, getCartTotal } = useCart();
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
      return 'bank-transfer';
    }
  });

  // Add state to store saved form data
  const [savedFormData, setSavedFormData] = useState(null);

  // Create refs for the child components
  const checkoutFormRef = useRef(null);
  
  // Check if cart is empty, redirect to home if it is
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
    
    // Check if we have shippable items
    const hasShippable = cart.some(item => item.shipping_class !== 'only_pickup');
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
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };
    
    loadSavedFormData();
  }, []);

  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
  }

  // Handle form data change
  const handleFormDataChange = (data) => {
    setFormData(data);
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
      
      // Redirect to the payment page
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

        <form onSubmit={handleSubmit} className={styles.checkoutForm}>
          <div className={styles.checkoutColumns}>
            <div className={styles.formColumn}>
              {/* Payment Method Selection - Moved to the top */}
              <PaymentSelector 
                paymentMethod={paymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                abonnementPageContent={abonnementPageData.acfFields}
              />

              <CheckoutForm 
                ref={checkoutFormRef}
                cart={cart} 
                paymentMethod={paymentMethod}
                pointDeChute={pointDeChute} 
                hasShippableItems={hasShippableItems}
                onFormDataChange={handleFormDataChange}
                onDeliveryMethodChange={handleDeliveryMethodChange}
                savedFormData={savedFormData}
              />

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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Traitement en cours...' : 'Confirmer la commande'}
                    </button>
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
                cart={cart} 
                getCartTotal={getCartTotal}
                deliveryMethod={deliveryMethod}
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
