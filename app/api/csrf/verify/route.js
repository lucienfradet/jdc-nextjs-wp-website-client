// app/api/csrf/verify/route.js
import { withCsrfProtection } from '@/lib/csrf-server';

// This endpoint just verifies if the token is valid
// The withCsrfProtection middleware handles the validation
async function handlePostRequest(request) {
  // If we get here, the token is valid
  return Response.json({ valid: true });
}

export const POST = withCsrfProtection(handlePostRequest);
