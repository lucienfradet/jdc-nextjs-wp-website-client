"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/checkout/PaymentPage.module.css';
import { useCart } from '@/context/CartContext';
import { StripeProvider, useStripe as useStripeContext } from '@/context/StripeContext';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";

const PaymentPageContent = ({ 
  headerData,
  footerData,
  siteIconUrl,
  pointDeChute
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { cart, getCartTotal, clearCart } = useCart();
  const [customerData, setCustomerData] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Get stripe context
  const { 
    clientSecret, 
    createPaymentIntent, 
    completeOrder, 
    resetPayment 
  } = useStripeContext();

  // Load saved form data from session storage
  useEffect(() => {
    try {
      const formData = sessionStorage.getItem('checkoutFormData');
      const paymentMethod = sessionStorage.getItem('checkoutPaymentMethod');
      const savedDeliveryMethod = sessionStorage.getItem('deliveryMethod');
      
      if (!formData || paymentMethod !== 'stripe') {
        // If no form data or if payment method isn't stripe, redirect back to checkout
        router.push('/checkout');
        return;
      }
      
      if (savedDeliveryMethod) {
        setDeliveryMethod(savedDeliveryMethod);
      }

      setCustomerData(JSON.parse(formData));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading saved data:', error);
      router.push('/checkout');
    }
  }, [router]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Initialize Stripe payment intent
  useEffect(() => {
    const initializeStripePayment = async () => {
      if (cart.length > 0 && !clientSecret) {
        await createPaymentIntent(getCartTotal(), {
          customerEmail: customerData?.billingEmail || 'no-email@example.com',
          orderItems: 'Order items from cart'
        });
      }
    };
    
    if (customerData && !isLoading) {
      initializeStripePayment();
    }
  }, [customerData, isLoading, cart, getCartTotal, clientSecret, createPaymentIntent]);

  // Handle successful payment
  const handlePaymentComplete = async (paymentIntent) => {
    setIsSubmitting(true);
    
    try {
      // Create order record in database
      const orderResult = await completeOrder({
        customer: customerData,
        items: cart,
        total: getCartTotal(),
        deliveryMethod,
        pickupLocation: customerData.selectedPickupLocation || null
      }, paymentIntent.id);
      
      // Order created successfully
      if (orderResult.orderId) {
        // Clear cart and show success message
        clearCart();
        setOrderComplete(true);
        
        // Clear session storage
        sessionStorage.removeItem('checkoutFormData');
        sessionStorage.removeItem('deliveryMethod');
        
        // Redirect to confirmation page after 2 seconds
        setTimeout(() => {
          router.push('/order-confirmation');
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing order:', error);
      setPaymentError(error.message || 'Une erreur est survenue lors du traitement de votre commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setPaymentError(error.message || 'Une erreur est survenue lors du paiement');
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement...</div>;
  }
  
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
        title="Paiement par carte - Le Jardin des chefs"
        description="Paiement sécurisé pour votre commande"
        canonicalUrl={process.env.NEXT_PUBLIC_SITE_URL + '/payment'}
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.paymentPageContainer}>
        <div className={styles.backLink}>
          <Link href="/checkout">← Retour au formulaire</Link>
        </div>

        <h1 className={styles.pageTitle}>Paiement par carte</h1>

        <div className={styles.paymentPageColumns}>
          <div className={styles.paymentColumn}>
            <div className={styles.customerInfo}>
              <h2>Informations du client</h2>
              <div className={styles.infoSection}>
                <h3>Coordonnées</h3>
                <p><strong>Nom:</strong> {customerData.billingFirstName} {customerData.billingLastName}</p>
                <p><strong>Email:</strong> {customerData.billingEmail}</p>
                <p><strong>Téléphone:</strong> {customerData.billingPhone}</p>
              </div>
              
              <div className={styles.infoSection}>
                {customerData.shippingSameAsBilling ? (
                  <h3>Adresse de livraison</h3>
                ) : (
                    <h3>Adresse de facturation</h3>
                  )}
                <p>{customerData.billingAddress1}</p>
                {customerData.billingAddress2 && <p>{customerData.billingAddress2}</p>}
                <p>{customerData.billingCity}, {customerData.billingState} {customerData.billingPostcode}</p>
                <p>{customerData.billingCountry}</p>
              </div>
              
              {deliveryMethod === 'shipping' && !customerData.shippingSameAsBilling && (
                <div className={styles.infoSection}>
                  <h3>Adresse de livraison</h3>
                  <p>{customerData.shippingFirstName} {customerData.shippingLastName}</p>
                  <p>{customerData.shippingAddress1}</p>
                  {customerData.shippingAddress2 && <p>{customerData.shippingAddress2}</p>}
                  <p>{customerData.shippingCity}, {customerData.shippingState} {customerData.shippingPostcode}</p>
                  <p>{customerData.shippingCountry}</p>
                </div>
              )}
              
              {customerData.selectedPickupLocation && pointDeChute && (
                <div className={styles.infoSection}>
                  <h3>Point de chute sélectionné</h3>
                  {(() => {
                    const selectedPoint = pointDeChute.find(
                      point => point.id.toString() === customerData.selectedPickupLocation.toString()
                    );

                    if (selectedPoint) {
                      return (
                        <>
                          <p><strong>{selectedPoint.location_name}</strong></p>
                          <p>{selectedPoint.adresse.adresse}</p>
                          <p>{selectedPoint.adresse.code_postale} {selectedPoint.adresse.city}</p>
                          <p>{selectedPoint.adresse.province}, {selectedPoint.adresse.pays}</p>
                          {selectedPoint.description_instructions && (
                            <p className={styles.pickupInstructions}>
                              <small><strong>Instructions: </strong>{selectedPoint.description_instructions}</small>
                            </p>
                          )}
                        </>
                      );
                    }

                    return <p>ID: {customerData.selectedPickupLocation}</p>;
                  })()}
                </div>
              )}
            </div>
            
            <div className={styles.stripeContainer}>
              <h2>Paiement sécurisé</h2>
              
              {clientSecret ? (
                <StripePaymentForm
                  onPaymentComplete={handlePaymentComplete}
                  onError={handlePaymentError}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <div className={styles.loadingMessage}>
                  Préparation du formulaire de paiement...
                </div>
              )}
              
              {paymentError && (
                <div className={styles.errorMessage}>
                  {paymentError}
                </div>
              )}
              
              <div className={styles.securePaymentInfo}>
                <div className={styles.secureIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <p>Paiement sécurisé par Stripe</p>
              </div>
            </div>
          </div>

          <div className={styles.summaryColumn}>
            <OrderSummary 
              cart={cart} 
              getCartTotal={getCartTotal}
              deliveryMethod={deliveryMethod}
              hideModifyCart={true}
            />
          </div>
        </div>
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
export default function PaymentPage(props) {
  return (
    <StripeProvider>
      <PaymentPageContent {...props} />
    </StripeProvider>
  );
}
