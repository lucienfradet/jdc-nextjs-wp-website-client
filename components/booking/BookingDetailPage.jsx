"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/context/NavigationContext';
import NavigationLink from '@/components/NavigationLink';
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
  const { startNavigation } = useNavigation();
  const { addToCart, hasBookingInCart, showBookingConfirmation } = useCart();
  const [isMobile, setIsMobile] = useState(false);
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [people, setPeople] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  
  // Availability state
  const [maxBookingPerSlot, setMaxBookingPerSlot] = useState(0);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedSlotAvailability, setSelectedSlotAvailability] = useState(null);
  
  const [allAvailabilityData, setAllAvailabilityData]   = useState({});
  const [unavailableDates, setUnavailableDates]         = useState([]);
  const [loadingMonths, setLoadingMonths]               = useState(new Set()); // months currently fetching
  const [loadedMonths, setLoadedMonths]                 = useState(new Set()); // months already fetched

  // Add rate limit state
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Parse available dates and time slots from product metadata
  const availableDates = parseAvailableDates(product);
  const timeSlots = parseTimeSlots(product);
  const defaultMaxPeople = product.stock_quantity || 1;
  
  // Check if product is out of stock
  const isOutOfStock = product.stock_status === "outofstock" || (product.manage_stock && product.stock_quantity <= 0);

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

  const fetchMonthAvailability = useCallback(async (year, month) => {
    const monthKey = `${year}-${month}`;

    // Skip if already loaded or currently loading
    if (loadedMonths.has(monthKey) || loadingMonths.has(monthKey)) return;

    // Only fetch dates that fall in this month
    const datesInMonth = availableDates.filter(
      d => d.getFullYear() === year && d.getMonth() === month
    );

    // Mark loaded immediately even if no dates (nothing to fetch)
    if (datesInMonth.length === 0 || isOutOfStock) {
      setLoadedMonths(prev => new Set(prev).add(monthKey));
      return;
    }

    setLoadingMonths(prev => new Set(prev).add(monthKey));

    try {
      const results = await Promise.all(
        datesInMonth.map(async (date) => {
          const formattedDate = formatDate(date);
          const response = await fetch('/api/booking/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, date: formattedDate }),
          });

          if (response.status === 429) {
            setIsRateLimited(true);
            throw new Error('Rate limited');
          }

          return { date, data: await response.json() };
        })
      );

      const newAvailability = {};
      const newUnavailable  = [];

      results.forEach(({ date, data }) => {
        const formattedDate = formatDate(date);
        newAvailability[formattedDate] = data;

        const allTimeSlotsAccounted = timeSlots.every(slot => {
          const slotKey = `${slot.from} - ${slot.to}`;
          return data.availability?.some(a => a.timeSlot === slotKey);
        });

        const isFullyBooked =
          data.availability?.length > 0 &&
          allTimeSlotsAccounted &&
          data.availability.every(slot => slot.available === 0);

        if (isFullyBooked) newUnavailable.push(date);
      });

      setAllAvailabilityData(prev => ({ ...prev, ...newAvailability }));
      setUnavailableDates(prev => [...prev, ...newUnavailable]);
      setLoadedMonths(prev => new Set(prev).add(monthKey));

    } catch (error) {
      console.error(`Error fetching availability for ${year}-${month}:`, error);
    } finally {
      setLoadingMonths(prev => {
        const next = new Set(prev);
        next.delete(monthKey);
        return next;
      });
    }
  }, [loadedMonths, loadingMonths, availableDates, product.id, timeSlots, isOutOfStock]);

  // Fetch the first month that has available dates on mount
  useEffect(() => {
    if (!availableDates || availableDates.length === 0 || isOutOfStock) return;
    const first = availableDates[0]; // already sorted ascending in BookingCalendar
    fetchMonthAvailability(first.getFullYear(), first.getMonth());
  }, []); // intentionally runs once — fetchMonthAvailability handles dedup internally

  // Called by BookingCalendar when the user navigates to a new month
  const handleMonthChange = useCallback((year, month) => {
    fetchMonthAvailability(year, month);
  }, [fetchMonthAvailability]);

  // Function to retry after rate limit
  const handleRetry = () => {
    window.location.reload();
  };

  // Function to handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    
    if (!date) return;
    
    const formattedDate = formatDate(date);
    const cachedAvailabilityData = allAvailabilityData[formattedDate];
    
    if (cachedAvailabilityData) {
      // Use the cached data
      setAvailabilityData(cachedAvailabilityData);
      
      // Filter available time slots
      const allTimeSlots = timeSlots || [];
      const availableSlots = allTimeSlots.filter(slot => {
        const slotKey = `${slot.from} - ${slot.to}`;
        const slotAvailability = cachedAvailabilityData.availability.find(a => a.timeSlot === slotKey);
        
        // If no availability data for this slot, assume it's fully available
        if (!slotAvailability) {
          return true;
        }
        
        // Only include slots that have at least one spot available
        return slotAvailability.available > 0;
      });
      
      setAvailableTimeSlots(availableSlots);
      setSelectedTimeSlot(null); // Reset selected time slot when date changes
    } else {
      // Fallback if cache misses (month not yet loaded)
      const allTimeSlots = timeSlots || [];
      setAvailableTimeSlots(allTimeSlots);
      setSelectedTimeSlot(null);
    }
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

  // Modified function to handle booking with confirmation flow
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
        type: 'mwb_booking', // Ensure we mark this as a booking product
        booking_details: {
          date: formatDate(selectedDate),
          time_slot: `${selectedTimeSlot.from} - ${selectedTimeSlot.to}`,
          people: people
        }
      };

      // Add to cart with the selected quantity and callbacks for success/cancel
      addToCart(bookingProduct, people, {
        onSuccess: () => {
          // Only redirect if add was successful and no confirmation needed
          startNavigation();
          router.push('/checkout');
        },
        onCancel: () => {
          // If user cancels the booking replacement, reset the booking state
          setIsBooking(false);
        }
      });
      
      // If adding to cart doesn't need confirmation (no existing booking),
      // then success will be true and we'll redirect in the onSuccess callback
      
      // If confirmation dialog is shown, we'll wait for user action
      // The confirmation component will handle the rest through callbacks
      
      // If there's already a booking and the confirmation dialog will be shown,
      // we'll keep the isBooking state as is until the user confirms or cancels
      if (!hasBookingInCart()) {
        // If there's no existing booking, we've already redirected
        // so we don't need to do anything here
      } else if (!showBookingConfirmation) {
        // If for some reason we had a booking but no confirmation is shown,
        // reset the booking state
        setIsBooking(false);
      }
      // Otherwise, keep isBooking true until confirmation dialog is closed
      
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
          <NavigationLink href="/agrotourisme">← Retour aux visites</NavigationLink>
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
                <p>Désolé, cette visite n&aapos;est pas disponible pour le moment.</p>
                <p>Veuillez consulter nos autres visites ou revenir ultérieurement.</p>
              </div>
            ) : (
              <>
              <div className={styles.calendarContainer}>
              <h3>Sélectionnez une date</h3>
              {isRateLimited ? (
                <div className={styles.errorMessage}>
                Trop de requêtes. Veuillez attendre 1 minute avant de réessayer.
                <button className={styles.retryButton} onClick={handleRetry}>
                Réessayer
                </button>
                </div>
              ) : (
                <BookingCalendar
                availableDates={availableDates}
                unavailableDates={unavailableDates}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                loadingMonths={loadingMonths}
                onMonthChange={handleMonthChange}
                />
              )}
              </div>

                {selectedDate && (
                  <>
                    <div className={styles.timeSlotContainer}>
                      <h3>Sélectionnez un créneau horaire</h3>
                      
                      {loadingMonths.size > 0 ? (
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
