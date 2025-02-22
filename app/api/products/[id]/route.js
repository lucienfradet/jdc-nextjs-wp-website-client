import { fetchWooProductById } from "@/lib/wooCommerce";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const product = await fetchWooProductById(id);
    
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
