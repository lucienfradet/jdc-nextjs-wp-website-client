import { axiosInstance } from '@/lib/sslConfig';
import { fetchImageData } from './api';
import shippingCalculator from '@/lib/shipping/ShippingCalculator';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// console.log("url: " + API_URL);
// console.log("key: " + WOOCOMMERCE_CONSUMER_KEY);
// console.log("secret: " + WOOCOMMERCE_CONSUMER_SECRET);

// Standard return format
const successResponse = (data) => ({ success: true, data });
const errorResponse = (error) => ({ success: false, error });

export async function fetchWooProducts() {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,price_html,shipping_class,tax_status,shipping_taxable,images,description,short_description,type,stock_quantity,meta_data,stock_status,manage_stock,categories",
        per_page: 100  // Increase from default 10 to 100
      },
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    });

    const data = res.data;

    const processedProducts = await Promise.all(data.map(async (product) => {
      const processedImages = await Promise.all(product.images.map(async (image) => {
        const processedImage = await fetchImageData(image);
        return processedImage.id;
      }));
      return {
        ...product,
        images: processedImages,
      };
    }));


    return successResponse(processedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse("Failed to fetch products");
  }
}

export const fetchWooProductById = async (id) => {
  try {
    const res = await axiosInstance.get(`${API_URL}/products/${id}`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,price_html,shipping_class,tax_status,shipping_taxable,images,description,short_description,type,stock_quantity,meta_data,stock_status,manage_stock,categories",
        per_page: 100  // Increase from default 10 to 100
      },
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    });

    const product = res.data;

    // Process images for single product
    const processedImages = await Promise.all(
      product.images.map(async (image) => {
        const processedImage = await fetchImageData(image);
        return processedImage.id;
      })
    );

    return successResponse({
      ...product,
      images: processedImages,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse(`Failed to fetch product with id: ${id}`);
  }
};

/**
 * Fetch products by type or category
 * @param {string} filterType - Type of filter to apply: 'booking', 'panier', or 'online-store'
 * @returns {Promise<Array|Object>} - Array of products or error object
 */
export async function fetchProductsFiltered(filterType) {
  try {
    // Fetch all products
    const productsResponse = await fetchWooProducts();
    
    // Check if the fetchWooProducts returned an error
    if (!productsResponse.success) {
      return errorResponse(productsResponse.error);
    }
    
    const products = productsResponse.data;
    
    let filteredProducts;
    
    switch (filterType) {
      case 'booking':
        // Filter by product type
        filteredProducts = products.filter(product => product.type === 'mwb_booking');
        break;
      case 'panier-de-legumes':
        // Filter by panier category
        filteredProducts = products.filter(product => 
          product.categories && 
          product.categories.some(category => category.slug === 'panier-de-legumes')
        );
        break;
      case 'online-store':
        // Filter by online store category
        filteredProducts = products.filter(product => 
          product.categories && 
          product.categories.some(category => category.slug === 'online-store')
        );
        break;
      case 'all':
        filteredProducts = products;
        break;
      default:
        return errorResponse(`Invalid filter type: ${filterType}`, { status: 400 });
    }
    
    return successResponse(filteredProducts);
  } catch (error) {
    return errorResponse(`Failed to filter products: ${error.message || error}`);
  }
}

export async function fetchTaxRates() {
  try {
    let allTaxRates = [];
    let currentPage = 1;
    let hasMorePages = true;
    const perPage = 10; // Fetch 100 items per page
    
    // Continue fetching until we've retrieved all pages
    while (hasMorePages) {
      const response = await axiosInstance.get(`${API_URL}/taxes`, {
        params: {
          page: currentPage,
          per_page: perPage
        },
        auth: {
          username: WOOCOMMERCE_CONSUMER_KEY,
          password: WOOCOMMERCE_CONSUMER_SECRET
        }
      });
      
      const currentPageTaxRates = response.data;
      
      // Add this page's results to our collected results
      allTaxRates = [...allTaxRates, ...currentPageTaxRates];
      
      // Check if we should continue to the next page
      // If we got fewer items than requested per page, we're on the last page
      if (currentPageTaxRates.length < perPage) {
        hasMorePages = false;
      } else {
        currentPage++;
      }
    }
    
    return allTaxRates;
  } catch (error) {
    console.error('Error fetching tax rates:', error);
    throw new Error('Failed to fetch tax rates from WooCommerce');
  }
}

export async function fetchMaxBookingPerSlot(id) {
  try {
    const res = await axiosInstance.get(`${API_URL}/products/${id}`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,max_booking_per_slot",
      },
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    });

    const product = res.data;

    return successResponse({
      ...product,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse(`Failed to fetch product with id: ${id}`);
  }
};

/**
 * Validates order data against WooCommerce pricing
 * @param {Object} orderData - The order data from client
 * @returns {Object} - Validation result with success flag and discrepancies if any
 */
export async function validateOrderData(orderData) {
  try {
    console.log('Starting order validation with data:', JSON.stringify(orderData, null, 2));
    
    // Validate that orderData contains expected properties
    if (!orderData) {
      throw new Error('Order data is missing');
    }
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order items are missing or empty');
    }

    // 1. Extract product IDs and quantities
    const productIds = orderData.items.map(item => item.id);
    console.log('Extracted product IDs:', productIds);
    
    // 2. Fetch fresh product data from WooCommerce
    console.log('Fetching fresh product data from WooCommerce...');
    const productPromises = productIds.map(id => fetchWooProductById(id));
    const productResults = await Promise.all(productPromises);
    
    // Check if any product fetch failed
    const failedProducts = productResults.filter(result => !result.success);
    if (failedProducts.length > 0) {
      console.error('Some products failed to fetch:', failedProducts);
      throw new Error('Some products could not be verified: ' + 
        failedProducts.map(p => p.error).join(', '));
    }
    
    // Create a lookup for quick access
    const freshProducts = productResults.reduce((acc, result) => {
      acc[result.data.id] = result.data;
      return acc;
    }, {});
    
    console.log('Successfully fetched fresh product data for all items');
    
    // 3. Validate each line item
    const discrepancies = [];
    console.log('Starting line item validation...');
    
    for (const item of orderData.items) {
      console.log(`Validating item: ${item.id} - ${item.name}`);
      const freshProduct = freshProducts[item.id];
      
      // Skip validation for products we couldn't fetch
      if (!freshProduct) {
        console.warn(`No fresh product data for item ${item.id} - ${item.name}, skipping validation`);
        continue;
      }
      
      // -----------------
      // PRICE VALIDATION
      // -----------------
      const clientPrice = parseFloat(item.price);
      const actualPrice = parseFloat(freshProduct.price);
      
      console.log(`Price validation for ${item.name}: Client: ${clientPrice}, Actual: ${actualPrice}`);
      
      if (Math.abs(clientPrice - actualPrice) > 0.01) { // 1 cent tolerance for floating point issues
        console.warn(`Price discrepancy detected for ${item.name}`);
        discrepancies.push({
          type: 'price',
          productId: item.id,
          productName: item.name,
          clientValue: clientPrice,
          actualValue: actualPrice
        });
      }
      
      // Continue with other validations as in your original code...
      // (I'm keeping this shorter for clarity but you would retain all your original validation logic)
      
      // -----------------
      // STOCK VALIDATION
      // -----------------
      if (freshProduct.manage_stock === true) {
        console.log(`Stock validation for ${item.name}: Client status: ${item.stock_status}, Actual: ${freshProduct.stock_status}`);
        
        if (item.stock_status !== freshProduct.stock_status) {
          console.warn(`Stock status discrepancy for ${item.name}`);
          discrepancies.push({
            type: 'stock_status',
            productId: item.id,
            productName: item.name,
            clientValue: item.stock_status,
            actualValue: freshProduct.stock_status
          });
        }

        // Other stock validations...
      }
      
      // Other validations (tax, shipping, etc.) would continue here...
    }

    console.log(`Line item validation complete. Found ${discrepancies.length} discrepancies.`);

    // 4. Create validated item data using fresh product information
    console.log('Creating validated items based on fresh product data...');
    const validatedItems = orderData.items.map(item => {
      const freshProduct = freshProducts[item.id];
      if (!freshProduct) {
        console.warn(`No fresh product data for ${item.id}, keeping original item data`);
        return item; // Keep original if we couldn't fetch
      }
      
      return {
        ...item,
        price: parseFloat(freshProduct.price).toString(),
        tax_status: freshProduct.tax_status,
        shipping_class: freshProduct.shipping_class,
        shipping_taxable: freshProduct.shipping_taxable,
        stock_status: freshProduct.stock_status,
        manage_stock: freshProduct.manage_stock,
        stock_quantity: freshProduct.stock_quantity,
        quantity: item.quantity,
        booking_details: item.booking_details
      };
    });

    // 5. Validate the delivery method
    console.log(`Validating delivery method: ${orderData.deliveryMethod}`);
    const deliveryMethod = orderData.deliveryMethod || 'shipping';
    if (!['shipping', 'pickup'].includes(deliveryMethod)) {
      console.warn(`Invalid delivery method: ${deliveryMethod}`);
      discrepancies.push({
        type: 'delivery_method',
        clientValue: deliveryMethod,
        actualValue: 'shipping',
        message: 'Méthode de livraison invalide'
      });
    }
    
    // 6. Calculate server-side shipping costs using existing ShippingCalculator
    console.log('Calculating server-side shipping costs...');
    if (!shippingCalculator || typeof shippingCalculator.calculateShipping !== 'function') {
      throw new Error('Shipping calculator is not available');
    }

    // Calculate shipping using your existing calculator
    const serverShippingCost = shippingCalculator.calculateShipping(validatedItems, deliveryMethod);
    console.log(`Server calculated shipping cost: ${serverShippingCost}, Client shipping cost: ${orderData.shippingCost || 0}`);

    // Compare with client-provided shipping cost
    if (Math.abs(serverShippingCost - (orderData.shippingCost || 0)) > 0.01) {
      console.warn('Shipping cost discrepancy detected');
      discrepancies.push({
        type: 'shipping',
        clientValue: orderData.shippingCost || 0,
        actualValue: serverShippingCost,
      });
    }

    // 7. Re-calculate total taxes server-side using validated data
    console.log('Validating state code and recalculating taxes...');
    // Validate state code first
    const validStateCode = validateStateCode(orderData.customer?.billingState);
    console.log(`State code validation: Client: ${orderData.customer?.billingState}, Valid: ${validStateCode}`);
    const billingState = validStateCode ? orderData.customer.billingState : 'QC'; // Default to Quebec if invalid
    
    if (validStateCode !== orderData.customer?.billingState) {
      console.warn(`Invalid billing state: ${orderData.customer?.billingState}`);
      discrepancies.push({
        type: 'billing_state',
        clientValue: orderData.customer?.billingState,
        actualValue: billingState,
        message: 'Code de province invalide'
      });
    }
    
    // Calculate taxes with validated items, state and shipping
    console.log('Recalculating taxes...');
    const taxResult = await recalculateTaxes(validatedItems, billingState, serverShippingCost);
    
    if (!taxResult.success) {
      throw new Error('Could not validate taxes: ' + (taxResult.error || 'Unknown error'));
    }
    
    console.log(`Tax calculation result: ${JSON.stringify(taxResult, null, 2)}`);
    console.log(`Client tax: ${orderData.taxes?.totalTax || 0}, Server tax: ${taxResult.totalTax}`);
    
    // Compare taxes
    if (Math.abs(taxResult.totalTax - (orderData.taxes?.totalTax || 0)) > 0.01) {
      console.warn('Tax amount discrepancy detected');
      discrepancies.push({
        type: 'tax',
        clientValue: orderData.taxes?.totalTax || 0,
        actualValue: taxResult.totalTax,
      });
    }
    
    // 8. Calculate final totals and compare
    console.log('Calculating final totals...');
    const actualSubtotal = validatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
    
    const actualTotal = actualSubtotal + taxResult.totalTax + serverShippingCost;
    const clientTotal = orderData.total || 0;
    
    console.log(`Subtotal: ${actualSubtotal}`);
    console.log(`Final totals - Client: ${clientTotal}, Server: ${actualTotal}`);
    
    if (Math.abs(actualTotal - clientTotal) > 0.01) {
      console.warn('Total amount discrepancy detected');
      discrepancies.push({
        type: 'total',
        clientValue: clientTotal,
        actualValue: actualTotal,
      });
    }
    
    // 9. Return validation result
    const validationResult = {
      success: discrepancies.length === 0,
      discrepancies: discrepancies.length > 0 ? discrepancies : null,
      validatedData: {
        items: validatedItems,
        subtotal: actualSubtotal,
        tax: taxResult.totalTax,
        shipping: serverShippingCost,
        total: actualTotal,
        taxDetails: taxResult,
        billingState: billingState,
        deliveryMethod: deliveryMethod
      }
    };
    
    console.log(`Validation completed with result: ${validationResult.success}`, 
      validationResult.success ? 'No discrepancies found.' : 
      `Discrepancies: ${JSON.stringify(validationResult.discrepancies, null, 2)}`);
    
    return validationResult;
  } catch (error) {
    console.error('Validation error:', error);
    // Log the full error with stack trace if available
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: error.message || 'No specific error message',
      discrepancies: [] // Make sure to include this for API compatibility
    };
  }
}

/**
 * Helper function to validate state/province code
 * @param {string} stateCode - The state/province code to validate
 * @returns {string|null} - Valid state code or null if invalid
 */
function validateStateCode(stateCode) {
  if (!stateCode) return null;
  
  const validProvinces = ['QC', 'ON', 'NS', 'NB', 'MB', 'BC', 'PE', 'SK', 'AB', 'NL', 'NT', 'YT', 'NU'];
  const upperStateCode = stateCode.toUpperCase();
  
  return validProvinces.includes(upperStateCode) ? upperStateCode : null;
}

/**
 * Recalculates taxes using the validated item data
 * @param {Array} validatedItems - Array of validated order items
 * @param {string} province - Province/state code
 * @param {number} shipping - Shipping cost
 * @returns {Object} - Tax calculation result
 */
async function recalculateTaxes(validatedItems, province, shipping) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/calculate-taxes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: validatedItems,
        province,
        shipping
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate taxes');
    }

    const taxData = await response.json();
    
    // Check if the response contains an error property
    if (taxData.error) {
      throw new Error(taxData.error);
    }
    
    return {
      success: true,
      ...taxData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Tax calculation failed'
    };
  }
}

/**
 * Create an order in WooCommerce based on our local order data
 */
export async function createWooCommerceOrder(order) {
  // Format tax lines if tax details are available
  let taxLines = [];
  if (order.taxDetails) {
    try {
      const taxDetails = JSON.parse(order.taxDetails);
      taxLines = Object.entries(taxDetails.taxSummary).map(([name, tax]) => ({
        rate_id: 0, // We don't have the actual tax rate ID from WooCommerce
        rate_code: name.replace(' ', '_').toLowerCase(),
        label: name,
        compound: false,
        tax_total: tax.amount.toString(),
        shipping_tax_total: "0"
      }));
    } catch (e) {
      console.error('Error parsing tax details:', e);
    }
  }

  // Format line items
  const lineItems = order.items.map(item => {
    // Start with default meta_data
    const metaData = [
      {
        key: "_is_pickup_only",
        value: item.isPickupOnly ? "yes" : "no"
      },
      {
        key: "_shipping_class",
        value: item.shippingClass || "standard"
      }
    ];

    // Add booking metadata if this is a booking item
    if (item.isBooking) {
      if (item.bookingDate) {
        metaData.push({
          key: "_date_of_booking",
          value: item.bookingDate
        });
        metaData.push({
          key: "Date de la réservation", // Human-readable version
          value: item.bookingDate
        });
      }

      if (item.bookingTimeSlot) {
        metaData.push({
          key: "_booking_time_slot",
          value: item.bookingTimeSlot
        });
        metaData.push({
          key: "Horaire de réservation", // Human-readable version
          value: item.bookingTimeSlot
        });
      }

      if (item.bookingPeople) {
        metaData.push({
          key: "_booking_people",
          value: item.bookingPeople.toString()
        });
        metaData.push({
          key: "Nombre de personnes", // Human-readable version
          value: item.bookingPeople.toString()
        });
      }
    }

    return {
      product_id: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price.toString(),
      total: item.subtotal.toString(),
      total_tax: item.tax.toString(),
      meta_data: metaData
    };
  });

  // Prepare shipping data
  const shipping = {
    first_name: order.customer.firstName,
    last_name: order.customer.lastName,
    address_1: order.shippingAddress1 || "",
    address_2: order.shippingAddress2 || "",
    city: order.shippingCity || "",
    state: order.shippingState || "",
    postcode: order.shippingPostcode || "",
    country: order.shippingCountry || "CA"
  };

  // Prepare billing data
  const billing = {
    first_name: order.customer.firstName,
    last_name: order.customer.lastName,
    email: order.customer.email,
    phone: order.customer.phone || "",
    address_1: order.billingAddress1 || "",
    address_2: order.billingAddress2 || "",
    city: order.billingCity || "",
    state: order.billingState || "",
    postcode: order.billingPostcode || "",
    country: order.billingCountry || "CA"
  };

  // Prepare metadata for additional order details
  const metaData = [
    {
      key: "_payment_intent_id",
      value: order.paymentIntentId
    },
    {
      key: "_order_confirmation_number",
      value: order.orderNumber
    },
    {
      key: "_delivery_method",
      value: order.deliveryMethod
    },

    // Visible versions (for admin UI)
    {
      key: "Payment Intent ID",  // Human-readable name without underscore
      value: order.paymentIntentId
    },
    {
      key: "Numéro de confirmation",    // Human-readable name in French
      value: order.orderNumber
    },
    {
      key: "Méthode de livraison",  // Human-readable name in French
      value: order.deliveryMethod === 'pickup' ? 'Cueillette' : 'Livraison'
    }
  ];

  // Add pickup location metadata if applicable
  if (order.deliveryMethod === 'pickup' && order.pickupLocation) {
    metaData.push({
      key: "_pickup_location_id",
      value: order.pickupLocation.wordpressId.toString()
    });
    metaData.push({
      key: "_pickup_location_name",
      value: order.pickupLocation.name
    });

    // Visible versions
    metaData.push({
      key: "Point de chute ID",
      value: order.pickupLocation.wordpressId.toString()
    });
    metaData.push({
      key: "Point de chute",
      value: order.pickupLocation.name
    });
  }

  // Construct the WooCommerce order payload
  const wcOrderPayload = {
    payment_method: "stripe",
    payment_method_title: "Carte de crédit (Stripe)",
    set_paid: true,
    billing,
    shipping,
    line_items: lineItems,
    shipping_lines: [
      {
        method_id: order.deliveryMethod === 'pickup' ? "local_pickup" : "flat_rate",
        method_title: order.deliveryMethod === 'pickup' ? "Cueillette" : "Livraison",
        total: order.shipping.toString()
      }
    ],
    tax_lines: taxLines,
    meta_data: metaData,
    customer_id: 0, // Guest order (or you could use a WC customer ID if available)
    customer_note: order.notes || ""
  };

  // Send the order to WooCommerce
  const response = await axiosInstance.post(
    `${API_URL}/orders`,
    wcOrderPayload,
    {
      auth: {
        username: WOOCOMMERCE_CONSUMER_KEY,
        password: WOOCOMMERCE_CONSUMER_SECRET
      }
    }
  );

  return response.data;
}
