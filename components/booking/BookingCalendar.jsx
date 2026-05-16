"use client";
import { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from '@/styles/booking/BookingCalendar.module.css';

export default function BookingCalendar({
  availableDates,
  unavailableDates = [],
  selectedDate,
  onDateSelect,
  loadingMonths = new Set(),
  onMonthChange
}) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookableDates, setBookableDates] = useState([]);

  // Initialize bookable dates when component mounts or when availableDates changes
  useEffect(() => {
    if (availableDates && availableDates.length > 0) {
      const parsedDates = availableDates
        .filter(date => date instanceof Date && !isNaN(date))
        .sort((a, b) => a - b);

      setBookableDates(parsedDates);

      if (parsedDates.length > 0) {
        setCalendarDate(new Date(parsedDates[0]));
      }
    }
  }, [availableDates]);

  // Trigger fetch when user navigates to a new month
  const handleActiveStartDateChange = useCallback(({ activeStartDate, view }) => {
    if (view === 'month') {
      setCalendarDate(activeStartDate);
      if (onMonthChange) {
        onMonthChange(activeStartDate.getFullYear(), activeStartDate.getMonth());
      }
    }
  }, [onMonthChange]);

  const isDateEnabled = (date) => {
    return bookableDates.some(bookableDate =>
      bookableDate.getDate() === date.getDate() &&
      bookableDate.getMonth() === date.getMonth() &&
      bookableDate.getFullYear() === date.getFullYear()
    );
  };

  const isDateUnavailable = (date) => {
    return unavailableDates.some(unavailableDate =>
      unavailableDate.getDate() === date.getDate() &&
      unavailableDate.getMonth() === date.getMonth() &&
      unavailableDate.getFullYear() === date.getFullYear()
    );
  };

  // Disable tiles if the month is loading, not bookable, or fully booked
  const tileDisabled = ({ date }) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (loadingMonths.has(monthKey)) return true;
    return !isDateEnabled(date) || isDateUnavailable(date);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const classes = [];
      if (isDateEnabled(date)) {
        classes.push(styles.available);
        if (isDateUnavailable(date)) {
          classes.push(styles.unavailableSpots);
        }
      }
      if (selectedDate &&
          date.getDate() === selectedDate.getDate() &&
          date.getMonth() === selectedDate.getMonth() &&
          date.getFullYear() === selectedDate.getFullYear()) {
        classes.push(styles.selected);
      }
      return classes.join(' ');
    }
    return null;
  };

  const handleDateChange = (date) => {
    if (isDateEnabled(date) && !isDateUnavailable(date)) {
      onDateSelect(date);
    }
  };

  // Check if the currently viewed month is loading
  const isCurrentMonthLoading = loadingMonths.size > 0;

  return (
    <div className={styles.calendarWrapper}>
      {/* Granular loading overlay - only covers the calendar */}
      {isCurrentMonthLoading && (
        <div className={styles.calendarLoadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Chargement des disponibilités...</p>
        </div>
      )}

      <Calendar
        onChange={handleDateChange}
        value={selectedDate || calendarDate}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        onActiveStartDateChange={handleActiveStartDateChange}
        locale="fr-FR"
        minDate={new Date()}
        className={styles.calendar}
        showNeighboringMonth={false}
        formatShortWeekday={(locale, date) =>
          date.toLocaleDateString(locale, { weekday: 'narrow' })
        }
        view="month"
        onDrillDown={null}
        onDrillUp={null}
        navigationLabel={null}
        showNavigation={true}
        maxDetail="month"
        minDetail="month"
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
