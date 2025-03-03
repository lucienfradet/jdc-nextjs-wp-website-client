"use client";

import { useState, useEffect } from 'react';
import styles from '@/styles/checkout/OrderSummary.module.css';
import WPImage from '@/components/WPImage';
import DrawerCart from "@/components/DrawerCart";

export default function OrderSummary({ 
  cart, 
  getCartTotal, 
  deliveryMethod = 'shipping',
  hideModifyCart = false
}) {
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasShippableItems, setHasShippableItems] = useState(false);
  
  useEffect(() => {
    // Calculate totals
    const subtotalValue = getCartTotal();
    setSubtotal(subtotalValue);
    
    // Calculate tax (for now, applying 5% GST and 9.975% QST in Quebec)
    const gst = subtotalValue * 0.05;
    const qst = subtotalValue * 0.09975;
    setTax(gst + qst);
    
    // For now, flat shipping rate
    // In a real implementation, this would be calculated based on shipping address and items
    const shippableItems = cart.some(item => item.shipping_class !== 'only_pickup');
    const shouldApplyShipping = shippableItems && deliveryMethod === 'shipping';
    setHasShippableItems(shippableItems);
    setShipping(shouldApplyShipping ? 15 : 0);
    
    // Calculate total
    setTotal(subtotalValue + (gst + qst) + (shouldApplyShipping ? 15 : 0));
  }, [cart, getCartTotal, deliveryMethod]);
  
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
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Sous-total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Taxes (GST/QST)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className={styles.totalRow}>
          {hasShippableItems && (
            <>
              <span>Livraison</span>
              <span>{shipping > 0 ? formatCurrency(shipping) : 'Gratuit'}</span>
            </>
          )}
        </div>
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
