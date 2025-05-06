"use client";

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from '@/styles/booking/BookingCalendar.module.css';

export default function BookingCalendar({ 
  availableDates, 
  unavailableDates = [], 
  selectedDate, 
  onDateSelect,
  isLoading = false 
}) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookableDates, setBookableDates] = useState([]);

  // Initialize bookable dates when component mounts or when availableDates changes
  useEffect(() => {
    // Convert date strings to Date objects and sort them
    if (availableDates && availableDates.length > 0) {
      const parsedDates = availableDates
        .filter(date => date instanceof Date && !isNaN(date))
        .sort((a, b) => a - b);
      
      setBookableDates(parsedDates);
      
      // If there are available dates and they're in the future, set the calendar to the month of the first available date
      if (parsedDates.length > 0) {
        const firstAvailableDate = new Date(parsedDates[0]);
        setCalendarDate(firstAvailableDate);
      }
    }
  }, [availableDates]);

  // Function to check if a date is enabled (bookable)
  const isDateEnabled = (date) => {
    return bookableDates.some(bookableDate => 
      bookableDate.getDate() === date.getDate() &&
      bookableDate.getMonth() === date.getMonth() &&
      bookableDate.getFullYear() === date.getFullYear()
    );
  };

  // Function to check if a date is unavailable (no available spots)
  const isDateUnavailable = (date) => {
    return unavailableDates.some(unavailableDate => 
      unavailableDate.getDate() === date.getDate() &&
      unavailableDate.getMonth() === date.getMonth() &&
      unavailableDate.getFullYear() === date.getFullYear()
    );
  };

  // Custom tile content to highlight available dates
  const tileContent = ({ date, view }) => {
    if (view === 'month' && isDateEnabled(date)) {
      return <div className={styles.availableDate}></div>;
    }
    return null;
  };

  // Custom class name for the tiles
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      let classNames = [];
      
      // First check if the date is enabled/bookable
      if (isDateEnabled(date)) {
        // Add 'available' class for bookable dates
        classNames.push(styles.available);
        
        // Then check if it's unavailable (no available spots)
        if (isDateUnavailable(date)) {
          classNames.push(styles.unavailableSpots);
        }
      }
      
      // Add 'selected' class for the selected date
      if (selectedDate &&
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()) {
        classNames.push(styles.selected);
      }
      
      return classNames.join(' ');
    }
    return null;
  };

  // Handle date change
  const handleDateChange = (date) => {
    // Only allow selection of available dates with available spots
    if (isDateEnabled(date) && !isDateUnavailable(date)) {
      onDateSelect(date);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.calendarLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Chargement des disponibilités...</p>
      </div>
    );
  }

  return (
    <div className={styles.calendarWrapper}>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate || calendarDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        tileDisabled={({ date }) => !isDateEnabled(date) || isDateUnavailable(date)}
        locale="fr-FR"
        calendarType='gregory'
        minDate={new Date()}
        className={styles.calendar}
        next2Label={null}
        prev2Label={null}
        showNeighboringMonth={false}
        formatShortWeekday={(locale, date) => 
          date.toLocaleDateString(locale, { weekday: 'narrow' })
        }
        view="month"                // Force month view
        onDrillDown={null}          // Disable drilling down
        onDrillUp={null}            // Disable drilling up
        navigationLabel={null}      // Remove the navigation label (which is clickable)
        showNavigation={true}       // Keep month navigation arrows
        maxDetail="month"           // Set maximum detail level to month
        minDetail="month"           // Set minimum detail level to month
      />
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.available}`}></div>
          <span>Date disponible</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.unavailableSpots}`}></div>
          <span>Complet</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.selected}`}></div>
          <span>Date sélectionnée</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.unavailable}`}></div>
          <span>Date indisponible</span>
        </div>
      </div>
    </div>
  );
}
