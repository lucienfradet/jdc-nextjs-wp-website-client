import { axiosInstance } from '@/lib/sslConfig';

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;

// console.log("url: " + API_URL);
// console.log("key: " + CONSUMER_KEY);
// console.log("secret: " + CONSUMER_SECRET);

export async function fetchWooProducts() {
  try {
    const res = await axiosInstance.get(`${API_URL}/products`, {
      params: {
        // Include meta_data to fetch custom fields
        _fields: "id,name,price,images,meta_data,description",
      },
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
      }
    });

    // Map products to include pickup locations from meta_data
    const productsWithLocations = res.data.map((product) => ({
      ...product,
      // Extract pickup locations from meta_data (adjust key as needed)
      pickup_locations:
        product.meta_data.find((meta) => meta.key === "_pickup_locations")?.value || [],
    }));

    return productsWithLocations;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}
