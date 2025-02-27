"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/checkout/CheckoutForm.module.css';
import { useCart } from '@/context/CartContext';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import PaymentGateway from '@/components/checkout/PaymentGateway';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";

export default function CheckoutPage({ 
  headerData,
  footerData,
  siteIconUrl,
  pointDeChute
}) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { cart, getCartTotal, clearCart } = useCart();
  const [hasShippableItems, setHasShippableItems] = useState(false);
  const [formData, setFormData] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Check if cart is empty, redirect to home if it is
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
    
    // Check if we have shippable items
    const hasShippable = cart.some(item => item.shipping_class !== 'only_pickup');
    setHasShippableItems(hasShippable);
  }, [cart, router]);

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

  // Handle form data change
  const handleFormDataChange = (data) => {
    setFormData(data);
  };
  
  // Handle payment data change
  const handlePaymentDataChange = (data) => {
    setPaymentData(data);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate all required fields
    const errors = {};
    
    // Validate billing address
    ['billingFirstName', 'billingLastName', 'billingEmail', 'billingPhone', 
     'billingAddress1', 'billingCity', 'billingState', 'billingPostcode'].forEach(field => {
      if (!formData[field]) {
        errors[field] = 'Ce champ est requis';
      }
    });
    
    // Validate shipping address if we have shippable items and "same as billing" is not checked
    if (hasShippableItems && !formData.shippingSameAsBilling) {
      ['shippingFirstName', 'shippingLastName', 'shippingAddress1', 
       'shippingCity', 'shippingState', 'shippingPostcode'].forEach(field => {
        if (!formData[field]) {
          errors[field] = 'Ce champ est requis';
        }
      });
    }

    // Validate pickup location if we have pickup-only items
    if (cart.some(item => item.shipping_class === 'only_pickup') && !formData.selectedPickupLocation) {
      errors.selectedPickupLocation = 'Veuillez sélectionner un point de chute';
    }
    
    // Validate payment data
    if (paymentData.method === 'credit-card') {
      ['cardNumber', 'cardName', 'expiryDate', 'cvv'].forEach(field => {
        if (!paymentData[field]) {
          errors[field] = 'Ce champ est requis';
        }
      });
      
      // Additional card validation
      if (paymentData.cardNumber && paymentData.cardNumber.replace(/\s/g, '').length < 16) {
        errors.cardNumber = 'Numéro de carte invalide';
      }
      
      if (paymentData.expiryDate && !paymentData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        errors.expiryDate = 'Format invalide (MM/YY)';
      }
      
      if (paymentData.cvv && !paymentData.cvv.match(/^\d{3,4}$/)) {
        errors.cvv = 'CVV invalide';
      }
    }
    
    setFormErrors(errors);
    
    // If we have errors, stop submission
    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      // Scroll to the first error
      const firstError = document.querySelector(`.${styles.inputError}`);
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Simulate API call to place order
    setTimeout(() => {
      // In a real implementation, this would be an API call to the server
      // to create the order and process payment
      
      console.log('Order Submitted:', {
        customer: formData,
        payment: paymentData,
        items: cart,
        total: getCartTotal()
      });
      
      // Clear cart and show success message
      clearCart();
      setOrderComplete(true);
      setIsSubmitting(false);
      
      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        router.push('/order-confirmation');
      }, 2000);
    }, 2000);
  };

  if (cart.length === 0) {
    return <div className={styles.emptyCart}>Votre panier est vide</div>;
  }
  
  if (orderComplete) {
    return (
      <div className={styles.orderComplete}>
        <h2>Merci pour votre commande!</h2>
        <p>Votre commande a été traitée avec succès. Vous allez être redirigé vers la page de confirmation.</p>
      </div>
    );
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
              <CheckoutForm 
                cart={cart} 
                pointDeChute={pointDeChute} 
                hasShippableItems={hasShippableItems}
                onFormDataChange={handleFormDataChange}
              />

              <PaymentGateway 
                onPaymentDataChange={handlePaymentDataChange}
              />

              <div className={styles.submitSection}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Traitement en cours...' : 'Confirmer la commande'}
                </button>
                {Object.keys(formErrors).length > 0 && (
                  <div className={styles.formErrorSummary}>
                    Veuillez corriger les erreurs dans le formulaire pour continuer.
                  </div>
                )}
                <p className={styles.termsText}>
                  En confirmant votre commande, vous acceptez nos conditions générales de vente et notre politique de confidentialité.
                </p>
              </div>
            </div>

            <div className={styles.summaryColumn}>
              <OrderSummary 
                cart={cart} 
                getCartTotal={getCartTotal}
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
