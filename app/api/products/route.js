import { fetchWooProducts } from "@/lib/wooCommerce";

export async function GET() {
    try {
        const products = await fetchWooProducts();
        return Response.json(products);
    } catch (error) {
        return Response.json({ error: `Failed to fetch products, error: ${error}` }, { status: 500 });
    }
}
