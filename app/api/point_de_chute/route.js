import { getPageFieldsByName } from "@/lib/api";
import prisma from "@/lib/prisma";

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

    // Sync with database
    await syncPickupLocationsWithDatabase(points)
      .catch(error => console.error("Background db sync error: ", error));

    return Response.json(points);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function syncPickupLocationsWithDatabase(points) {
  // Process each point from WordPress
  for (const point of points) {
    try {
      // Try to find an existing record with the same WordPress ID
      const existingLocation = await prisma.pickupLocation.findFirst({
        where: { wordpressId: point.id }
      });
      
      // Prepare data for database operations
      const locationData = {
        wordpressId: point.id,
        name: point.location_name,
        address: point.adresse.adresse,
        city: point.adresse.city,
        state: point.adresse.province,
        postalCode: point.adresse.code_postale,
        country: point.adresse.pays || "CA",
        description: point.description_instructions,
        isActive: true,
      };
      
      if (existingLocation) {
        // Check if any data has changed
        const hasChanged = 
          existingLocation.name !== locationData.name ||
          existingLocation.address !== locationData.address ||
          existingLocation.city !== locationData.city ||
          existingLocation.state !== locationData.state ||
          existingLocation.postalCode !== locationData.postalCode ||
          existingLocation.country !== locationData.country ||
          existingLocation.description !== locationData.description;
        
        if (hasChanged) {
          // Only update if data has changed
          await prisma.pickupLocation.update({
            where: { id: existingLocation.id },
            data: {
              ...locationData,
              updatedAt: new Date(),
            }
          });
          
          console.log(`Updated pickup location #${point.id}: ${point.location_name} (data changed)`);
        }
      } else {
        // Create new record
        await prisma.pickupLocation.create({
          data: locationData
        });
        
        console.log(`Created new pickup location #${point.id}: ${point.location_name}`);
      }
    } catch (error) {
      console.error(`Error syncing pickup location #${point.id}:`, error);
    }
  }
}
