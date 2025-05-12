"use client";

import { useCsrf } from '@/context/CsrfContext';

/**
 * A component that adds a hidden CSRF token input field to a form
 * This can be included in any form that needs CSRF protection
 */
export default function CsrfTokenField() {
  const { csrfToken } = useCsrf();
  
  return (
    <input 
      type="hidden" 
      name="csrf_token" 
      value={csrfToken || ''} 
    />
  );
}
