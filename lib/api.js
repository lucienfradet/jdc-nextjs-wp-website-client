import { safeFetch } from "@/lib/sslConfig";

// NOT TESTED...
export async function getAllPosts() {
  try {
    const response = await safeFetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}posts?context=embed&_fields=id,title,content`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const posts = await response.json();
    
    // Restructure to match previous GraphQL response format
    return {
      posts: {
        nodes: posts.map(post => ({
          id: post.id,
          title: post.title?.rendered || '',
          content: post.content?.rendered || ''
        }))
      }
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { posts: { nodes: [] } };
  }
}

export async function getPageFieldsByName(name) {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}pages?slug=${name}`;
  // console.log("Fetching URL:", url); // Log the API URL

  try {
    // Fetch data from the REST API
    const response = await safeFetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch page data: ${response.statusText}`);
    }

    const pages = await response.json();
    // console.log(pages);

    if (!pages || pages.length === 0) {
      throw new Error(`No page found with the slug: ${name}`);
    }

    const page = pages[0];

    if (!page.acf) {
      throw new Error(`No ACF fields found for the page: ${name}`);
    }

    // Parse title and ACF fields
    const rawAcfFields = { ...page.acf };
    const processedAcfFields = await fetchImageData(rawAcfFields);

    return {
      id: page.id,
      title: page.title?.rendered || '',
      acfFields: processedAcfFields,
    };
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

// Function to fetch image data for numeric ACF fields
async function fetchImageData(acfFields) {
  const processedFields = { ...acfFields }; // Create a copy to modify

  await Promise.all(
    Object.entries(processedFields).map(async ([key, value]) => {
      try {
        if (typeof value !== "number") return;

        const response = await safeFetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}media/${value}?_fields=id,alt_text,media_details,source_url`
        );

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} for media ${value}`);
        }

        const mediaItem = await response.json();
        const { id, alt_text, media_details, source_url } = mediaItem;

        // Handle missing sizes
        if (!media_details?.sizes) {
          processedFields[key] = createFallbackImageData(id, alt_text, source_url, media_details);
          return;
        }

        processedFields[key] = createImageDataObject(id, alt_text, media_details, source_url);
      } catch (error) {
        console.error(`Error processing field "${key}":`, error.message);
        processedFields[key] = createErrorImageData(value);
      }
    })
  );

  return processedFields;
}

function createImageDataObject(id, alt_text, media_details, source_url) {
  return {
    id,
    alt: alt_text || "",
    sizes: Object.entries(media_details.sizes).reduce((acc, [sizeKey, sizeData]) => ({
      ...acc,
      [sizeKey]: {
        source_url: sizeData.source_url,
        width: sizeData.width,
        height: sizeData.height,
      }
    }), {}),
    full: media_details.sizes.full?.source_url || source_url
  };
}

function createFallbackImageData(id, alt_text, source_url, media_details) {
  return {
    id,
    alt: alt_text || "",
    sizes: {
      full: {
        source_url,
        width: media_details?.width || 0,
        height: media_details?.height || 0
      }
    },
    full: source_url
  };
}

function createErrorImageData(originalValue) {
  return {
    error: true,
    message: "Failed to process image data",
    originalValue
  };
}

export async function fetchSiteIcon() {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/`;

  try {
    const response = await safeFetch(url);
    const data = await response.json();
    // console.log(`icon data: ${data.site_icon_url}`);
    return data.site_icon_url;
  } catch (error) {
    console.error("Error fetching site icon:", error);
    return null;
  }
}
