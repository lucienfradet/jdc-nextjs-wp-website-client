"use client";

import Link from 'next/link';
import WPImage from '@/components/WPImage';
import styles from '@/styles/booking/BookingProductCard.module.css';
import { renderContent, stripHtml } from '@/lib/textUtils';

export default function BookingProductCard({ product, buttonText, buttonLink }) {
  // Get the first image
  const featuredImage = product.images && product.images.length > 0 ? product.images[0] : null;
  
  // Prepare description
  const shortDescription = product.short_description 
    ? stripHtml(product.short_description) 
    : stripHtml(product.description).substring(0, 150) + '...';
    
  // Check if product is out of stock
  const isOutOfStock = product.stock_status === "outofstock";

  return (
    <div className={styles.bookingCard}>
      <div className={styles.imageContainer}>
        {featuredImage ? (
          <WPImage 
            image={featuredImage} 
            className={styles.productImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>Image non disponible</span>
          </div>
        )}
      </div>
      
      <div className={styles.contentContainer}>
        <h3 className={styles.productTitle}>{product.name}</h3>
        
        <div className={styles.productPrice}>
          <span className={styles.price}>
            {renderContent(product.price_html)}
          </span>
          <span className={styles.perPerson}>par personne</span>
        </div>
        
        {isOutOfStock && (
          <div className={styles.outOfStockBadge}>
            Actuellement non disponible
          </div>
        )}
        
        <div className={styles.productDescription}>
          {shortDescription}
        </div>
        
        <Link 
          href={buttonLink} 
          className={`${styles.bookButton} ${isOutOfStock ? styles.disabledButton : ''}`}
          aria-disabled={isOutOfStock}
        >
          {isOutOfStock ? "Non disponible" : (buttonText || "Réserver")}
        </Link>
      </div>
    </div>
  );
}
