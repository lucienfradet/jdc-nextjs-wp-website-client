"use client";

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from '@/styles/booking/BookingCalendar.module.css';

export default function BookingCalendar({ availableDates, selectedDate, onDateSelect }) {
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
      
      // Add 'available' class for bookable dates
      if (isDateEnabled(date)) {
        classNames.push(styles.available);
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
    if (isDateEnabled(date)) {
      onDateSelect(date);
    }
  };

  return (
    <div className={styles.calendarWrapper}>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate || calendarDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        tileDisabled={({ date }) => !isDateEnabled(date)}
        locale="fr-FR"
        minDate={new Date()}
        className={styles.calendar}
        next2Label={null}
        prev2Label={null}
        showNeighboringMonth={false}
        formatShortWeekday={(locale, date) => 
          date.toLocaleDateString(locale, { weekday: 'narrow' })
        }
      />
      
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.available}`}></div>
          <span>Date disponible</span>
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
