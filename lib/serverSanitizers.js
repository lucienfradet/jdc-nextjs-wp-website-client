import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

// General string sanitization
export const sanitizeString = (value) => {
  if (!value) return '';
  const stripped = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  return stripped.trim();
};

// Object sanitization - sanitize all string properties in an object 
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

// Common validators
export const isValidEmail = (email) => {
  if (!email) return false;
  const sanitized = sanitizeString(email);
  return validator.isEmail(sanitized);
};

export const isValidPhone = (phone) => {
  if (!phone) return false;
  const sanitized = sanitizeString(phone);
  return validator.isMobilePhone(sanitized, 'any', { strictMode: false });
};

export const isValidPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const sanitized = sanitizeString(postalCode);
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(sanitized);
};
