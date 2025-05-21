"use client";

import { useState } from 'react';
import BookingProductCard from './BookingProductCard';
import styles from '@/styles/booking/BookingProductsList.module.css';

export default function BookingProductsList({ products }) {
  const [isLoading, _setIsLoading] = useState(false);

  if (!products || products.length === 0) {
    return (
      <div className={styles.noProducts}>
        <p>Aucune visite disponible pour le moment. Veuillez vérifier ultérieurement.</p>
      </div>
    );
  }

  return (
    <div className={styles.bookingProductsContainer}>
      {isLoading ? (
        <div className={styles.loading}>Chargement des visites...</div>
      ) : (
        <div className={styles.productGrid}>
          {products.map(product => (
            <BookingProductCard 
              key={product.id}
              product={product}
              buttonText="Réserver le tour"
              buttonLink={`/agrotourisme/${product.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
