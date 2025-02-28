"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/checkout/CheckoutPage.module.css';
import { useCart } from '@/context/CartContext';
import { StripeProvider, useStripe as useStripeContext } from '@/context/StripeContext';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import PaymentGateway from '@/components/checkout/PaymentGateway';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";

const CheckoutPageContent = ({ 
  headerData,
  footerData,
  siteIconUrl,
  abonnementPageData,
  pointDeChute
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { cart, getCartTotal, clearCart } = useCart();
  const [hasShippableItems, setHasShippableItems] = useState(false);
  const [formData, setFormData] = useState({});
  const [paymentData, setPaymentData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [orderTotalAmount, setOrderTotalAmount] = useState(0);

  // Create refs for the child components
  const checkoutFormRef = useRef(null);
  const paymentGatewayRef = useRef(null);
  
  // Get stripe context
  const { 
    completeOrder, 
    paymentStatus, 
    resetPayment 
  } = useStripeContext();

  // Check if cart is empty, redirect to home if it is
  useEffect(() => {
    if (cart.length === 0) {
      router.push('/');
    }
    
    // Check if we have shippable items
    const hasShippable = cart.some(item => item.shipping_class !== 'only_pickup');
    setHasShippableItems(hasShippable);
    
    // Calculate the total amount
    setOrderTotalAmount(getCartTotal());
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

  // Handle delivery method change
  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
  }

  // Handle form data change
  const handleFormDataChange = (data) => {
    setFormData(data);
  };
  
  // Handle payment data change
  const handlePaymentDataChange = (data) => {
    setPaymentData(data);
  };
  
  // Focus on the first error element
  const focusOnFirstError = () => {
    // Check which component has the first error
    const checkoutFormElement = checkoutFormRef.current?.getFirstErrorElement();
    const paymentGatewayElement = paymentGatewayRef.current?.getFirstErrorElement();
    
    // Focus on the first error element found
    if (checkoutFormElement) {
      checkoutFormElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      checkoutFormElement.focus();
    } else if (paymentGatewayElement) {
      paymentGatewayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paymentGatewayElement.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate checkout form
    const checkoutFormValidation = await checkoutFormRef.current.validate();
    
    // Validate payment gateway
    const paymentGatewayValidation = await paymentGatewayRef.current.validate();
    
    // Combine all errors
    const allErrors = {
      ...(checkoutFormValidation.hasErrors ? checkoutFormValidation.errors : {}),
      ...(paymentGatewayValidation.hasErrors ? paymentGatewayValidation.errors : {})
    };
    
    // If we have errors, stop submission
    if (Object.keys(allErrors).length > 0) {
      setFormErrors(allErrors);
      setIsSubmitting(false);
      
      // Focus on the first error element
      focusOnFirstError();
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    // Get payment method
    const paymentMethod = paymentGatewayRef.current.getPaymentMethod();
    
    try {
      // Handle based on payment method
      if (paymentMethod === 'stripe') {
        // For Stripe, the payment is already processed by this point if successful
        if (paymentData.paymentStatus === 'succeeded') {
          // Create order record in database
          const orderResult = await completeOrder({
            customer: formData,
            items: cart,
            total: getCartTotal(),
            deliveryMethod,
            pickupLocation: formData.selectedPickupLocation || null
          }, paymentData.paymentIntentId);
          
          // Order created successfully
          if (orderResult.orderId) {
            // Clear cart and show success message
            clearCart();
            setOrderComplete(true);
            
            // Redirect to confirmation page after 2 seconds
            setTimeout(() => {
              router.push('/order-confirmation');
            }, 2000);
          }
        } else {
          throw new Error('Le paiement n\'a pas été traité correctement');
        }
      } else {
        // For bank transfer or custom credit card form
        // In a real implementation, this would be an API call to create the order
        
        // Simulate API call to place order
        setTimeout(() => {
          // Clear cart and show success message
          clearCart();
          setOrderComplete(true);
          
          // Reset payment state
          resetPayment();
          
          // Redirect to confirmation page after 2 seconds
          setTimeout(() => {
            router.push('/order-confirmation');
          }, 2000);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing order:', error);
      setFormErrors({
        submission: error.message || 'Une erreur est survenue lors du traitement de votre commande'
      });
    } finally {
      setIsSubmitting(false);
    }
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
                ref={checkoutFormRef}
                cart={cart} 
                pointDeChute={pointDeChute} 
                hasShippableItems={hasShippableItems}
                onFormDataChange={handleFormDataChange}
                onDeliveryMethodChange={handleDeliveryMethodChange}
              />

              <PaymentGateway 
                ref={paymentGatewayRef}
                onPaymentDataChange={handlePaymentDataChange}
                abonnementPageData={abonnementPageData}
                total={orderTotalAmount}
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
};

// Wrapper component that provides the Stripe context
export default function CheckoutPage(props) {
  return (
    <StripeProvider>
      <CheckoutPageContent {...props} />
    </StripeProvider>
  );
}
