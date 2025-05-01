"use client";

import styles from '@/styles/booking/BookingCartItem.module.css';

/**
 * Component to display booking-specific details in the cart
 */
export default function BookingCartItem({ item }) {
  // Check if this is a booking product with booking details
  if (!item.booking_details) {
    return null;
  }

  const { date, time_slot, people } = item.booking_details;

  return (
    <div className={styles.bookingDetails}>
      <div className={styles.bookingDetail}>
        <span className={styles.label}>Date:</span>
        <span className={styles.value}>{date}</span>
      </div>
      
      <div className={styles.bookingDetail}>
        <span className={styles.label}>Horaire:</span>
        <span className={styles.value}>{time_slot}</span>
      </div>
      
      <div className={styles.bookingDetail}>
        <span className={styles.label}>Personnes:</span>
        <span className={styles.value}>{people}</span>
      </div>
    </div>
  );
}
