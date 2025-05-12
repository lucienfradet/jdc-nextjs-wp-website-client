"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/checkout/PaymentPage.module.css';
import { useCart } from '@/context/CartContext';
import { useCsrf } from '@/context/CsrfContext';
import { StripeProvider, useStripe as useStripeContext } from '@/context/StripeContext';
import StripePaymentForm from '@/components/checkout/StripePaymentForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import ValidationErrorDisplay from '@/components/checkout/ValidationErrorDisplay';
import CsrfTokenField from '@/components/form/CsrfTokenField';

const PaymentPageContent = ({ 
  headerData,
  footerData,
  pointDeChute
}) => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { cart, taxes, getShippingCost, getCartTotal, updateProvince, updateDeliveryMethod } = useCart();
  const { csrfToken, isLoading: csrfLoading } = useCsrf();
  const [customerData, setCustomerData] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [csrfError, setCsrfError] = useState(false);

  // Get stripe context
  const { 
    clientSecret, 
    createPaymentIntent, 
    paymentStatus,
    orderNumber,
    paymentError,
    setPaymentError
  } = useStripeContext();

  // Load saved form data from session storage
  useEffect(() => {
    async function fetchData() {
      try {
        const formData = sessionStorage.getItem('checkoutFormData');
        const paymentMethod = sessionStorage.getItem('checkoutPaymentMethod');
        const savedDeliveryMethod = sessionStorage.getItem('deliveryMethod');
        const savedCsrfToken = sessionStorage.getItem('csrfToken');

        // Verify CSRF token presence
        if (!csrfToken && !savedCsrfToken) {
          setCsrfError(true);
          return;
        }

        if (!formData || paymentMethod !== 'stripe') {
          // If no form data or if payment method isn't stripe, redirect back to checkout
          router.push('/checkout');
          return;
        }

        if (savedDeliveryMethod) {
          setDeliveryMethod(savedDeliveryMethod);
          updateDeliveryMethod(savedDeliveryMethod);
        }

        const parsedData = JSON.parse(formData);

        // Set the province for tax calculation if available
        if (parsedData.billingState) {
          updateProvince(parsedData.billingState);
        }

        setCustomerData(JSON.parse(formData));
      } catch (error) {
        console.error('Error loading saved data:', error);
        router.push('/checkout');
      }
    }

    fetchData();
  }, [router, updateProvince, updateDeliveryMethod, csrfToken]);

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
      // Only proceed if we haven't already created a payment intent
      if (cart.length > 0 && !clientSecret && customerData && !orderNumber && csrfToken) {
        // check if pointDeChute needs to be sent
        let selectedPoint = undefined;
        if (pointDeChute && deliveryMethod !== 'shipping') {
          selectedPoint = pointDeChute.find(
            point => point.id.toString() === customerData.selectedPickupLocation.toString()
          );
        }

        const metadata = {
          // Basic customer information (minimal)
          customer_email: customerData.billingEmail || '',
          customer_name: `${customerData.billingFirstName} ${customerData.billingLastName}`.trim(),
          
          // Basic order info
          order_total: getCartTotal().toString(),
          delivery_method: deliveryMethod,
          
          // If delivery method is not shipping, include pickup location details
          pickup_location_id: deliveryMethod === 'shipping' ? '' : customerData.selectedPickupLocation || '',
          pickup_location_name: deliveryMethod === 'shipping' ? '' : selectedPoint?.location_name || ''
        };


        const orderData = {
          customer: customerData,
          items: cart,
          total: getCartTotal(),
          deliveryMethod,
          pickupLocation: customerData.selectedPickupLocation || null
        }

        await createPaymentIntent(getCartTotal(), orderData, taxes, getShippingCost(), metadata);
      }
    };
    
    initializeStripePayment();
  }, [customerData, clientSecret, cart, taxes, getShippingCost, csrfToken]);

  // Handle successful payment
  const handlePaymentComplete = async () => {
    setIsSubmitting(true);

    try {
        // Clear session storage
        sessionStorage.removeItem('checkoutFormData');
        sessionStorage.removeItem('checkoutPaymentMethod');
        sessionStorage.removeItem('deliveryMethod');
        sessionStorage.removeItem('csrfToken');

        setOrderComplete(true);
        
        // Redirect to confirmation page after 2 seconds
        setTimeout(() => {
          router.push('/order-confirmation?order=' + orderNumber);
        }, 2000);
    } catch (error) {
      console.error('Error completing order:', error);
      if (setPaymentError) {
        setPaymentError(error.message || 'Une erreur est survenue lors du traitement de votre commande');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for payment status changes
  useEffect(() => {
    if (paymentStatus === 'succeeded') {
      setOrderComplete(true);
    }
  }, [paymentStatus]);

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Only call this if setPaymentError is available from context
    if (setPaymentError) {
      setPaymentError(error);
    }
    setIsSubmitting(false);
  };

  if (csrfError) {
    return (
      <div className={styles.csrfError}>
        <h2>Erreur de sécurité</h2>
        <p>Votre session a expiré ou n'est pas valide. Veuillez retourner à la page de paiement et réessayer.</p>
        <Link href="/checkout" className={styles.backLink}>
          Retour au formulaire de paiement
        </Link>
      </div>
    );
  }

  if (cart.length === 0 && !orderComplete) {
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

  if (!customerData || isSubmitting || csrfLoading) {
    // Return null instead of a loading indicator, 
    // the LoadingWrapper will handle the loading UI
    return null;
  }

  return (
    <>
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
              
              {deliveryMethod === 'shipping' && (
                <div className={styles.infoSection}>
                  {customerData.shippingSameAsBilling ? (
                    <h3>Adresse de livraison</h3>
                  ) : (
                      <h3>Adresse de facturation</h3>
                    )}
                  <p>{customerData.billingAddress1}</p>
                  {customerData.billingAddress2 && <p>{customerData.billingAddress2}</p>}
                  <p>{customerData.billingCity}, {customerData.billingState}, {customerData.billingPostcode}</p>
                </div>
              )}
              
              {deliveryMethod === 'shipping' && !customerData.shippingSameAsBilling && (
                <div className={styles.infoSection}>
                  <h3>Adresse de livraison</h3>
                  <p>{customerData.shippingFirstName} {customerData.shippingLastName}</p>
                  <p>{customerData.shippingAddress1}</p>
                  {customerData.shippingAddress2 && <p>{customerData.shippingAddress2}</p>}
                  <p>{customerData.shippingCity}, {customerData.shippingState}, {customerData.shippingPostcode}</p>
                </div>
              )}
              
              {customerData.selectedPickupLocation && pointDeChute && deliveryMethod !== 'shipping' && (
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

              <form id="payment-form">
                {/* Add hidden CSRF token field */}
                <CsrfTokenField />

                {/* Show validation errors if present */}
                {paymentError && paymentError.type === 'validation' ? (
                  <ValidationErrorDisplay error={paymentError} />
                ) : clientSecret ? (
                    <StripePaymentForm
                      onPaymentComplete={handlePaymentComplete}
                      onError={handlePaymentError}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                      <div className={styles.loadingMessage}>
                        Préparation du formulaire de paiement...
                        {paymentError && paymentError.type !== 'validation' && (
                          <div className={styles.errorMessage}>
                            {paymentError.message}
                          </div>
                        )}
                      </div>
                    )}
              </form>

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
