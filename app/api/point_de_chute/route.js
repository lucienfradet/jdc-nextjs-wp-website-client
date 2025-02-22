import { getPageFieldsByName } from "@/lib/api";

export async function GET() {
  try {
    const pageData = await getPageFieldsByName("point-de-chute");
    
    if (!pageData) {
      return Response.json({ error: "Page not found" }, { status: 404 });
    }

    // Extract points from ACF fields
    const points = [];
    let counter = 1;
    
    while (pageData.acfFields[`point_${counter}`]) {
      const point = pageData.acfFields[`point_${counter}`];
      points.push({
        id: counter,
        location_name: point.location_name,
        adresse: {
          adresse: point.adresse?.adresse || "",
          city: point.adresse?.ville || "",
          code_postale: point.adresse?.code_postale || "",
          pays: point.adresse?.pays || "",
          province: point.adresse?.province || "",
        },
        description_instructions: point.description_instructions || ""
      });
      counter++;
    }

    return Response.json(points);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
