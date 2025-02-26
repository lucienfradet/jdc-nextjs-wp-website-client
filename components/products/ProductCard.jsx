"use client"

import { useState } from 'react';
import Link from 'next/link';
import WPImage from "@/components/WPImage";
import styles from "@/styles/products/ProductCard.module.css";
import { useCart } from '@/context/CartContext';

export default function ProductCard({
  product,
  className,
  showDescription = false,
  showQuantity = true,
  showRemove = false,
  showAddToCart = false
}) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, removeFromCart} = useCart();

  const handleQuantityChange = (event) => {
    setQuantity(parseInt(event.target.value));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };
  
  const handleRemoveFromCart = () => {
    removeFromCart(product.id);
  };

  return (
    <article className={`${styles.card} ${className || ""}`}>
      <Link className={styles.cardLink} href={`/products/${product.id}`}>
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
