"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WPImage from '@/components/WPImage';
import DesktopHeader from '@/components/desktop/Header';
import MobileHeader from '@/components/mobile/Header';
import DesktopFooter from '@/components/desktop/Footer';
import MobileFooter from '@/components/mobile/Footer';
import BookingCalendar from '@/components/booking/BookingCalendar';
import { parseAvailableDates, parseTimeSlots, getMaxPeople, formatDate } from '@/lib/bookingApi';
import { useCart } from '@/context/CartContext';
import styles from '@/styles/booking/BookingDetailPage.module.css';

export default function BookingDetailPage({ headerData, footerData, product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [people, setPeople] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Parse available dates and time slots from product metadata
  const availableDates = parseAvailableDates(product);
  const timeSlots = parseTimeSlots(product);
  const maxPeople = getMaxPeople(product);

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

  // Function to handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null); // Reset time slot when date changes
  };

  // Function to handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Function to handle changing number of people
  const handlePeopleChange = (e) => {
    const value = parseInt(e.target.value);
    setPeople(Math.min(Math.max(1, value), maxPeople));
  };

  // Function to handle booking
  const handleBooking = () => {
    if (!selectedDate || !selectedTimeSlot) {
      setBookingError('Veuillez sélectionner une date et un créneau horaire');
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      // Create a modified product with the booking details
      const bookingProduct = {
        ...product,
        booking_details: {
          date: formatDate(selectedDate),
          time_slot: `${selectedTimeSlot.from} - ${selectedTimeSlot.to}`,
          people: people
        }
      };

      // Add to cart with the selected quantity (number of people)
      addToCart(bookingProduct, people);
      
      // Redirect to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error adding booking to cart:', error);
      setBookingError('Une erreur est survenue lors de l\'ajout au panier');
      setIsBooking(false);
    }
  };

  // Strip HTML from description
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  // Function to render the booking summary
  const renderBookingSummary = () => {
    if (!selectedDate) return null;

    return (
      <div className={styles.bookingSummary}>
        <h3>Résumé de votre réservation</h3>
        
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Tour :</span>
          <span className={styles.summaryValue}>{product.name}</span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Date :</span>
          <span className={styles.summaryValue}>
            {selectedDate.toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}
          </span>
        </div>
        
        {selectedTimeSlot && (
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Heure :</span>
            <span className={styles.summaryValue}>
              {selectedTimeSlot.from} - {selectedTimeSlot.to}
            </span>
          </div>
        )}
        
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Personnes :</span>
          <span className={styles.summaryValue}>{people}</span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Prix total :</span>
          <span className={styles.summaryTotal}>
            {(parseFloat(product.price) * people).toFixed(2)} €
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.bookingDetailContainer}>
        <div className={styles.backLink}>
          <Link href="/agrotourisme">← Retour aux visites</Link>
        </div>

        <div className={styles.bookingDetailContent}>
          <div className={styles.productInfo}>
            <h1 className={styles.productTitle}>{product.name}</h1>
            
            <div className={styles.productImageContainer}>
              {product.images && product.images.length > 0 ? (
                <WPImage
                  image={product.images[0]}
                  className={styles.productImage}
                />
              ) : (
                <div className={styles.placeholderImage}>
                  <span>Image non disponible</span>
                </div>
              )}
            </div>

            <div className={styles.productPrice}>
              <span className={styles.price}>{product.price} €</span> par personne
            </div>
            
            <div 
              className={styles.productDescription} 
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className={styles.bookingForm}>
            <h2>Réserver votre visite</h2>
            
            <div className={styles.calendarContainer}>
              <h3>Sélectionnez une date</h3>
              <BookingCalendar 
                availableDates={availableDates}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {selectedDate && (
              <>
                <div className={styles.timeSlotContainer}>
                  <h3>Sélectionnez un créneau horaire</h3>
                  <div className={styles.timeSlotList}>
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        className={`
                          ${styles.timeSlotButton}
                          ${selectedTimeSlot && selectedTimeSlot.from === slot.from ? styles.selected : ''}
                        `}
                        onClick={() => handleTimeSlotSelect(slot)}
                      >
                        {slot.from} - {slot.to}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.peopleContainer}>
                  <h3>Nombre de personnes</h3>
                  <div className={styles.peopleSelector}>
                    <button
                      className={styles.peopleButton}
                      onClick={() => setPeople(prev => Math.max(1, prev - 1))}
                      disabled={people <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxPeople}
                      value={people}
                      onChange={handlePeopleChange}
                      className={styles.peopleInput}
                    />
                    <button
                      className={styles.peopleButton}
                      onClick={() => setPeople(prev => Math.min(maxPeople, prev + 1))}
                      disabled={people >= maxPeople}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.maxPeopleInfo}>
                    Maximum {maxPeople} {maxPeople > 1 ? 'personnes' : 'personne'}
                  </div>
                </div>

                {renderBookingSummary()}

                {bookingError && (
                  <div className={styles.bookingError}>
                    {bookingError}
                  </div>
                )}

                <button
                  className={styles.bookingButton}
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTimeSlot || isBooking}
                >
                  {isBooking ? 'Réservation en cours...' : 'Réserver'}
                </button>
              </>
            )}
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
}
