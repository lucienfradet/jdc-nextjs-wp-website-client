import { fetchWooProducts } from "@/utils/wooCommerce"; // Move logic to /lib

export async function GET() {
    try {
        const products = await fetchWooProducts();
        return Response.json(products);
    } catch (error) {
        return Response.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
