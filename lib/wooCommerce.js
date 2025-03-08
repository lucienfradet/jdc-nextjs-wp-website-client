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
