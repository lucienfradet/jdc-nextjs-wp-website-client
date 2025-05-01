"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WPImage from "@/components/WPImage";
import styles from "@/styles/products/ProductCard.module.css";
import { useCart } from '@/context/CartContext';
import BookingCartItem from '@/components/booking/BookingCartItem';

export default function ProductCard({
  product,
  className,
  showDescription = false,
  showQuantity = true,
  showRemove = false,
  showAddToCart = false
}) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, removeFromCart, updateQuantity, cart } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Find if this product is already in the cart
  const cartItem = cart.find(item => item.id === product.id);
  
  // If this is a cart item, initialize the quantity state with the cart quantity
  useEffect(() => {
    if (cartItem && showRemove) {
      setQuantity(cartItem.quantity);
    }
  }, [cartItem, showRemove]);

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value);
    if (newQuantity < 1) return;
    
    setQuantity(newQuantity);
    
    // If in cart view, update the cart quantity directly
    if (showRemove && cartItem) {
      updateQuantity(product.id, newQuantity);
    }
  };

  const handleAddToCart = () => {
    setIsAddingToCart(true);
    addToCart(product, quantity);
    
    // Reset animation state after a short delay
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };
  
  const handleRemoveFromCart = () => {
    removeFromCart(product.id);
  };

  // Check if this is a booking product
  const isBookingProduct = product.type === 'mwb_booking';

  return (
    <article className={`${styles.card} ${className || ""} ${isAddingToCart ? styles.addingToCart : ''}`}>
      <Link className={styles.cardLink} href={isBookingProduct ? `/agrotourisme/${product.id}` : `/products/${product.id}`}>
        <div className={styles.imageContainer}>
          {product.images?.[0] && (
            <WPImage image={product.images[0]} className={styles.image} />
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{product.name}</h3>

          <div 
            className={styles.price}
            dangerouslySetInnerHTML={{ __html: product.price_html }}
          />

          {product.description && showDescription && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

        </div>
      </Link>

      {/* Show booking details if this is a booking product in the cart */}
      {showRemove && isBookingProduct && product.booking_details && (
        <BookingCartItem item={product} />
      )}

      <div className={styles.interactiveSection}>
        <div className={styles.topSection}>
          {showQuantity && (
            <>
              <div className={styles.quantitySelector}>
                <label htmlFor={`quantity-${product.id}`}>Quantité:</label>
                <input
                  type="number"
                  id={`quantity-${product.id}`}
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                />
              </div>
            </>
          )}

          {showRemove && (
            <a href="#" className={styles.removeFromCartLink} onClick={handleRemoveFromCart}>
              SUPRIMER
            </a>
          )}
        </div>

        {showAddToCart && (
          <button className={styles.addToCartButton} onClick={handleAddToCart}>
            Ajouter au panier
          </button>
        )}
      </div>
    </article>
  );
}
