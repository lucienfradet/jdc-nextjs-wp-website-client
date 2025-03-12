import { axiosInstance } from '@/lib/sslConfig';
import { fetchImageData } from './api';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// console.log("url: " + API_URL);
// console.log("key: " + WOOCOMMERCE_CONSUMER_KEY);
// console.log("secret: " + WOOCOMMERCE_CONSUMER_SECRET);

export async function fetchWooProducts() {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,price_html,shipping_class,tax_status,images,description",
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

    return processedProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export const fetchWooProductById = async (id) => {
  try {
    const res = await axiosInstance.get(`${API_URL}/products/${id}`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,price_html,shipping_class,tax_status,images,description",
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

    return {
      ...product,
      images: processedImages,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

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
  const lineItems = order.items.map(item => ({
    product_id: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price.toString(),
    total: item.subtotal.toString(),
    total_tax: item.tax.toString(),
    meta_data: [
      {
        key: "_is_pickup_only",
        value: item.isPickupOnly ? "yes" : "no"
      },
      {
        key: "_shipping_class",
        value: item.shippingClass || "standard"
      }
    ]
  }));

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
      key: "_our_order_number",
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
      key: "Numéro de référence",    // Human-readable name in French
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
