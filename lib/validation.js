import DOMPurify from 'dompurify';
import validator from 'validator';

// General string sanitization
export const sanitizeString = (value) => {
  if (!value) return '';
  // First sanitize HTML
  const sanitizedHtml = DOMPurify.sanitize(value);
  // Then convert to plain text (remove all HTML tags)
  return sanitizedHtml.replace(/<[^>]*>/g, '').trim();
};

// I think I can delete all of that shit lol

// Email validation
export const isValidEmail = (email) => {
  if (!email) return false;
  const sanitized = sanitizeString(email);
  return validator.isEmail(sanitized);
};

// Phone validation (basic international format)
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const sanitized = sanitizeString(phone);
  // Allow for various phone formats
  return validator.isMobilePhone(sanitized, 'any', { strictMode: false });
};

// Postal code validation (Canadian format)
export const isValidPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const sanitized = sanitizeString(postalCode);
  // Canadian postal code format: A1A 1A1
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(sanitized);
};

// Province validation (Possibly NOT USED)
export const isValidProvince = (province) => {
  if (!province) return false;
  const sanitized = sanitizeString(province);
  const validProvinces = ['QC', 'ON', 'NS', 'NB', 'MB', 'BC', 'PE', 'SK', 'AB', 'NL', 'NT', 'YT', 'NU'];
  return validProvinces.includes(sanitized.toUpperCase());
};

// Address validation (basic check for minimum length)
export const isValidAddress = (address) => {
  if (!address) return false;
  const sanitized = sanitizeString(address);
  return sanitized.length >= 5;
};

// City validation (letters, spaces, hyphens, minimum length)
export const isValidCity = (city) => {
  if (!city) return false;
  const sanitized = sanitizeString(city);
  return sanitized.length >= 2 && /^[A-Za-z\s\-']+$/.test(sanitized);
};

// Name validation (letters, spaces, hyphens, apostrophes)
export const isValidName = (name) => {
  if (!name) return false;
  const sanitized = sanitizeString(name);
  return sanitized.length >= 2 && /^[A-Za-z\s\-']+$/.test(sanitized);
};
