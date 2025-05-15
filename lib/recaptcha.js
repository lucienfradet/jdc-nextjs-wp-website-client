// Client-side reCAPTCHA functions
let recaptchaLoaded = false;

/**
 * Load the reCAPTCHA script if it hasn't been loaded already
 * @returns {Promise} A promise that resolves when reCAPTCHA is loaded
 */
export const loadReCaptchaScript = () => {
  return new Promise((resolve, reject) => {
    // If the script is already loaded, resolve immediately
    if (recaptchaLoaded || window.grecaptcha) {
      recaptchaLoaded = true;
      resolve();
      return;
    }

    try {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      
      // Set up load and error handlers
      script.onload = () => {
        recaptchaLoaded = true;
        resolve();
      };
      
      script.onerror = (_error) => {
        reject(new Error('Failed to load reCAPTCHA script'));
      };
      
      // Add script to document
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Execute reCAPTCHA and get a token for the specified action
 * @param {string} action - The action name for analytics
 * @returns {Promise<string>} A promise that resolves with the reCAPTCHA token
 */
export const executeReCaptcha = async (action) => {
  try {
    // Make sure the script is loaded
    await loadReCaptchaScript();
    
    // Wait for grecaptcha to be ready
    await new Promise((resolve) => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(resolve);
      } else {
        // If grecaptcha.ready is not available yet, poll for it
        const checkReady = setInterval(() => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            clearInterval(checkReady);
            window.grecaptcha.ready(resolve);
          }
        }, 100);
      }
    });
    
    // Execute reCAPTCHA with the specified action
    const token = await window.grecaptcha.execute(
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, 
      { action }
    );
    
    return token;
  } catch (error) {
    console.error('reCAPTCHA execution failed:', error);
    throw error;
  }
};

// Server-side reCAPTCHA verification
/**
 * Verify a reCAPTCHA token server-side
 * @param {string} token - The reCAPTCHA token to verify
 * @param {string} expectedAction - The expected action that was used when generating the token
 * @returns {Promise<Object>} A promise that resolves with the verification result
 */
export const verifyReCaptchaToken = async (token, expectedAction = null) => {
  try {
    if (!token) {
      return { 
        success: false, 
        score: 0, 
        error: 'No reCAPTCHA token provided' 
      };
    }
    
    // Make the verification request to Google
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      })
    });
    
    if (!response.ok) {
      throw new Error(`reCAPTCHA verification failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate the action if one was expected
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        score: data.score || 0,
        error: 'Action validation failed',
        details: `Expected "${expectedAction}", got "${data.action}"`
      };
    }
    
    // Check if the score is acceptable (0.5 is a common threshold)
    const isHuman = data.success && (data.score >= 0.5);
    
    return {
      success: isHuman,
      score: data.score || 0,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
      error: isHuman ? null : 'Score too low'
    };
  } catch (error) {
    console.error('reCAPTCHA server verification error:', error);
    return {
      success: false,
      score: 0,
      error: error.message || 'reCAPTCHA verification failed'
    };
  }
};

// Create a middleware for API routes
export const withRecaptchaVerification = (handler, expectedAction = null, minScore = 0.5) => {
  return async (request, ...args) => {
    // Skip verification for non-POST/PUT/PATCH methods
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return handler(request, ...args);
    }
    
    try {
      // Clone the request to avoid modifying the original
      const clonedRequest = request.clone();
      
      // Get the content type
      const contentType = request.headers.get('content-type') || '';
      
      // Handle different content types
      let recaptchaToken = null;
      
      if (contentType.includes('application/json')) {
        // JSON requests
        const body = await clonedRequest.json();
        recaptchaToken = body.recaptchaToken;
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Form submissions
        const formData = await clonedRequest.formData();
        recaptchaToken = formData.get('recaptchaToken');
      }
      
      // Verify the reCAPTCHA token
      const verificationResult = await verifyReCaptchaToken(recaptchaToken, expectedAction);
      
      // If verification failed, return an error response
      if (!verificationResult.success || (verificationResult.score < minScore)) {
        return Response.json({ 
          error: 'reCAPTCHA verification failed',
          details: verificationResult.error || 'Suspicious activity detected'
        }, { status: 400 });
      }
      
      // If verification succeeded, pass the original request to the handler
      return handler(request, ...args);
    } catch (error) {
      console.error('Error in reCAPTCHA verification middleware:', error);
      return Response.json({ 
        error: 'reCAPTCHA verification error',
        details: error.message
      }, { status: 500 });
    }
  };
};
