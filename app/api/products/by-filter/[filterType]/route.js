import { fetchProductsFiltered } from "@/lib/wooCommerce";

export async function GET(request, { params }) {
  try {
    const { filterType } = await params;

    const response = await fetchProductsFiltered(filterType);

    if (!response.success) {
      // Convert utility error to HTTP response
      return Response.json({ error: response.error }, { status: 404 });
    }

    return Response.json(response.data);
  } catch (error) {
    return Response.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
