/**
 * Parse available dates from the booking product metadata
 * @param {Object} product - The booking product
 * @returns {Array} Array of available dates as Date objects
 */
export function parseAvailableDates(product) {
  try {
    // Find the meta data containing available dates
    const availabilityMeta = product.meta_data.find(meta => meta.key === 'wps_mbfw_set_availability');
    
    if (!availabilityMeta || !availabilityMeta.value) {
      return [];
    }
    
    // Parse dates in DD-MM-YYYY format
    return availabilityMeta.value.split(', ').map(dateStr => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    });
  } catch (error) {
    console.error('Error parsing available dates:', error);
    return [];
  }
}

/**
 * Parse time slots from the booking product metadata
 * @param {Object} product - The booking product
 * @returns {Array} Array of time slot objects with from and to properties
 */
export function parseTimeSlots(product) {
  try {
    // Find the meta data containing time slots
    const timeSlotsMeta = product.meta_data.find(meta => meta.key === 'wps_mbfw_time_slots');
    
    if (!timeSlotsMeta || !timeSlotsMeta.value || !Array.isArray(timeSlotsMeta.value)) {
      return [];
    }
    
    return timeSlotsMeta.value.map(slot => ({
      from: slot._from,
      to: slot._to
    }));
  } catch (error) {
    console.error('Error parsing time slots:', error);
    return [];
  }
}

/**
 * Get the maximum number of people that can be booked
 * @param {Object} product - The booking product
 * @returns {number} Maximum number of people
 */
export function getMaxPeople(product) {
  // Use the stock quantity as the maximum number of people
  return product.stock_quantity || 1;
}

/**
 * Format a date as DD-MM-YYYY
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}
