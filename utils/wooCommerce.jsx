import axios from 'axios';
import https from 'https'; // Ensure this is imported

const API_URL = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/wc/v3`;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;

console.log("url: " + API_URL);
console.log("key: " + CONSUMER_KEY);
console.log("secret: " + CONSUMER_SECRET);
export async function fetchWooProducts() {
  const agent = new https.Agent({
    rejectUnauthorized: false // Bypass SSL verification
  });

  try {
    const res = await axios.get(`${API_URL}/products`, {
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
      },
      httpsAgent: agent // Add this
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching WooCommerce products:", error);
    return [];
  }
}
