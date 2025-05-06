"use client";

import { useState, useEffect } from 'react';
import styles from '@/styles/checkout/OrderSummary.module.css';
import WPImage from '@/components/WPImage';
import DrawerCart from "@/components/DrawerCart";
import { formatTaxRate } from '@/lib/taxUtils';
import { useCart } from '@/context/CartContext';

export default function OrderSummary({ 
  hideModifyCart = false
}) {
  const { 
    cart, 
    getCartSubtotal, 
    getShippingCost,
    taxes,
    getCartTotal,
    deliveryMethod
  } = useCart();
  
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasShippableItems, setHasShippableItems] = useState(false);
  const [hasOnlyBookingProducts, setHasOnlyBookingProducts] = useState(false);
  
  // Update values whenever cart, taxes, or deliveryMethod changes
  useEffect(() => {
    // Calculate totals
    const subtotalValue = getCartSubtotal();
    setSubtotal(subtotalValue);
    
    // For now, flat shipping rate
    // In a real implementation, this would be calculated based on shipping address and items
    const shippableItems = cart.some(item => item.shipping_class !== 'only_pickup');
    setHasShippableItems(shippableItems);
    
    // Check if cart has only booking products
    const onlyBookingProducts = cart.length > 0 && 
      cart.every(item => item.type === 'mwb_booking');
    setHasOnlyBookingProducts(onlyBookingProducts);
    
    setShipping(getShippingCost());
    
    // Calculate total
    setTotal(getCartTotal());
  }, [cart, getCartSubtotal, getCartTotal, taxes, deliveryMethod, getShippingCost]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };
  
  return (
    <div className={styles.orderSummary}>
      <h2>Résumé de la commande</h2>
      
      <div className={styles.itemList}>
        {cart.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemImage}>
              {item.images && item.images[0] && (
                <WPImage image={item.images[0]} />
              )}
            </div>
            <div className={styles.itemDetails}>
              <h3 className={styles.itemName}>{item.name}</h3>
              <div className={styles.itemMeta}>
                <span className={styles.itemQuantity}>Quantité: {item.quantity}</span>
                <span className={styles.itemPrice}>
                  {formatCurrency(parseFloat(item.price) * item.quantity)}
                </span>
              </div>
              {item.shipping_class === 'only_pickup' && (
                <div className={styles.pickupOnly}>
                  Cueillette seulement
                </div>
              )}
              {item.tax_status === 'none' && (
                <div className={styles.taxExempt}>
                  Exempt de taxes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Sous-total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {/* Only show shipping if there are shippable items and not only booking products */}
        {hasShippableItems && !hasOnlyBookingProducts && (
          <div className={styles.totalRow}>
            <span>Livraison{deliveryMethod === 'pickup' ? ' (Cueillette)' : ''}</span>
            <span>{shipping > 0 ? formatCurrency(shipping) : 'Gratuit'}</span>
          </div>
        )}

        {/* Tax Rows */}
        {Object.entries(taxes.taxSummary).map(([taxName, taxInfo]) => (
          <div key={taxName} className={styles.totalRow}>
            <span>{taxName} ({formatTaxRate(taxInfo.rate)})</span>
            <span>{formatCurrency(taxInfo.amount)}</span>
          </div>
        ))}
        
        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      {!hideModifyCart && (
        <div className={styles.returnToCart}>
          <DrawerCart
            trigger={{
              content: (
                <span className={styles.modifyCartLink}>Modifier le panier</span>
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
