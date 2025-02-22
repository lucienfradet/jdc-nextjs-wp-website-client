"use client"

import { useState } from 'react';
import Link from 'next/link';
import WPImage from "@/components/WPImage";
import styles from "@/styles/products/ProductCard.module.css";

export default function ProductCard({
  product,
  className,
  showDescription = false,
  showQuantity = true,
  showRemove = false,
  showAddToCart = false
}) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (event) => {
    setQuantity(parseInt(event.target.value));
  };

  const handleAddToCart = () => {
    // Add logic to add the product to the cart with the selected quantity
    console.log(`Adding ${quantity} of "${product.name}" to the cart`);
  };
  
  const handleRemoveFromCart = () => {
    // Add logic to remove the product from the cart
    console.log(`Removing "${product.name}" from the cart`);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <article className={`${styles.card} ${className || ""}`}>
        <div className={styles.imageContainer}>
          {product.images?.[0] && (
            <WPImage image={product.images[0]} className={styles.image} />
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{product.name}</h3>

          <div className={styles.details}>
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
                retirer
              </a>
            )}

            {showAddToCart && (
              <button className={styles.addToCartButton} onClick={handleAddToCart}>
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
