import { axiosInstance } from '@/lib/sslConfig';
import { fetchImageData } from './api';
import ProductCard from '@/components/products/ProductCard';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const WOOCOMMERCE_CONSUMER_KEY = process.env.CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.CONSUMER_SECRET;

// console.log("url: " + API_URL);
// console.log("key: " + CONSUMER_KEY);
// console.log("secret: " + CONSUMER_SECRET);

export async function fetchWooProducts() {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,price_html,shipping_class,images,description",
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
        _fields: "id,name,price,price_html,shipping_class,images,description",
      },
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
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
