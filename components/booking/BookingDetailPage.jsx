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
import { parseAvailableDates, parseTimeSlots, formatDate } from '@/lib/bookingApi';
import { renderContent } from '@/lib/textUtils';
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
  
  // Availability state
  const [maxBookingPerSlot, setMaxBookingPerSlot] = useState(0);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedSlotAvailability, setSelectedSlotAvailability] = useState(null);

  // Parse available dates and time slots from product metadata
  const availableDates = parseAvailableDates(product);
  const timeSlots = parseTimeSlots(product);
  const defaultMaxPeople = product.stock_quantity || 1;
  
  // Check if product is out of stock
  const isOutOfStock = product.stock_status === "outofstock";

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
  
  // Fetch initial max booking per slot when component mounts
  useEffect(() => {
    const fetchMaxBooking = async () => {
      try {
        const response = await fetch(`/api/booking/max-per-slot/${product.id}`);
        if (response.ok) {
          const data = await response.json();
          setMaxBookingPerSlot(data.maxBookingPerSlot || defaultMaxPeople);
        } else {
          // Fallback to default value
          setMaxBookingPerSlot(defaultMaxPeople);
        }
      } catch (error) {
        console.error('Error fetching max booking per slot:', error);
        setMaxBookingPerSlot(defaultMaxPeople);
      }
    };
    
    fetchMaxBooking();
  }, [product.id, defaultMaxPeople]);

  // Function to fetch availability data when a date is selected
  const fetchAvailability = async (date) => {
    if (!date) return;
    
    setIsLoadingAvailability(true);
    
    try {
      const formattedDate = formatDate(date);
      
      const response = await fetch('/api/booking/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          date: formattedDate
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const data = await response.json();
      setAvailabilityData(data);
      
      // Filter available time slots
      const allTimeSlots = timeSlots || [];
      const availableSlots = allTimeSlots.filter(slot => {
        const slotKey = `${slot.from} - ${slot.to}`;
        const slotAvailability = data.availability.find(a => a.timeSlot === slotKey);
        
        // If no availability data for this slot, assume it's fully available
        if (!slotAvailability) {
          return true;
        }
        
        // Only include slots that have at least one spot available
        return slotAvailability.available > 0;
      });
      
      setAvailableTimeSlots(availableSlots);
      setSelectedTimeSlot(null); // Reset selected time slot when date changes
      
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Fallback to showing all time slots
      setAvailableTimeSlots(timeSlots || []);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Function to handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchAvailability(date);
  };

  // Function to handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    
    // Find availability for this slot
    if (availabilityData && availabilityData.availability) {
      const slotKey = `${timeSlot.from} - ${timeSlot.to}`;
      const slotAvailability = availabilityData.availability.find(a => a.timeSlot === slotKey);
      
      setSelectedSlotAvailability(slotAvailability);
      
      // Update people count if needed
      if (slotAvailability && people > slotAvailability.available) {
        setPeople(Math.max(1, slotAvailability.available));
      }
    }
  };

  // Function to handle changing number of people
  const handlePeopleChange = (e) => {
    const value = parseInt(e.target.value, 10);
    
    if (isNaN(value)) return;
    
    // Calculate the max people allowed
    let maxAllowed = maxBookingPerSlot;
    
    // If we have slot availability data, use that to limit the number of people
    if (selectedSlotAvailability) {
      maxAllowed = Math.min(maxAllowed, selectedSlotAvailability.available);
    }
    
    // Ensure value is within valid range
    setPeople(Math.min(Math.max(1, value), maxAllowed));
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
            {(parseFloat(product.price) * people).toFixed(2)} $
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
              <span className={styles.price}>{renderContent(product.price_html)}</span> par personne
            </div>
            
            {isOutOfStock && (
              <div className={styles.outOfStockMessage}>
                Actuellement non disponible
              </div>
            )}
            
            <div 
              className={styles.productDescription} 
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className={styles.bookingForm}>
            <h2>Réserver votre visite</h2>
            
            {isOutOfStock ? (
              <div className={styles.bookingNotAvailable}>
                <p>Désolé, cette visite n'est pas disponible pour le moment.</p>
                <p>Veuillez consulter nos autres visites ou revenir ultérieurement.</p>
              </div>
            ) : (
              <>
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
                      
                      {isLoadingAvailability ? (
                        <div className={styles.loadingMessage}>
                          Vérification de la disponibilité...
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className={styles.noTimeSlotsMessage}>
                          Aucun créneau horaire disponible pour cette date
                        </div>
                      ) : (
                        <div className={styles.timeSlotList}>
                          {availableTimeSlots.map((slot, index) => {
                            // Find availability data for this slot
                            const slotKey = `${slot.from} - ${slot.to}`;
                            const slotAvailability = availabilityData?.availability?.find(a => a.timeSlot === slotKey);
                            
                            // Calculate available spots
                            const availableSpots = slotAvailability ? slotAvailability.available : maxBookingPerSlot;
                            const totalSpots = slotAvailability ? slotAvailability.maxBooking : maxBookingPerSlot;
                            
                            return (
                              <div key={index} className={styles.timeSlotItem}>
                                <button
                                  className={`
                                    ${styles.timeSlotButton}
                                    ${selectedTimeSlot && selectedTimeSlot.from === slot.from ? styles.selected : ''}
                                  `}
                                  onClick={() => handleTimeSlotSelect(slot)}
                                >
                                  {slot.from} - {slot.to}
                                </button>
                                <span className={styles.availabilityIndicator}>
                                  Il reste {availableSpots} places disponibles sur {totalSpots}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {selectedTimeSlot && (
                      <div className={styles.peopleContainer}>
                        <h3>Nombre de personnes</h3>
                        
                        {selectedSlotAvailability && (
                          <div className={styles.availabilityInfo}>
                            Il reste {selectedSlotAvailability.available} places disponibles sur {selectedSlotAvailability.maxBooking}
                          </div>
                        )}
                        
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
                            max={selectedSlotAvailability ? selectedSlotAvailability.available : maxBookingPerSlot}
                            value={isNaN(people) ? 1 : people}
                            onChange={handlePeopleChange}
                            className={styles.peopleInput}
                          />
                          <button
                            className={styles.peopleButton}
                            onClick={() => {
                              const maxAllowed = selectedSlotAvailability ? 
                                selectedSlotAvailability.available : maxBookingPerSlot;
                              setPeople(prev => Math.min(maxAllowed, prev + 1));
                            }}
                            disabled={people >= (selectedSlotAvailability ? selectedSlotAvailability.available : maxBookingPerSlot)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

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
