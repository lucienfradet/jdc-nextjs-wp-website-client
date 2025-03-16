import { safeFetch } from "@/lib/sslConfig";

export async function getPageFieldsByName(name, revalidateTime = 3600) {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}pages?slug=${name}`;
  // console.log("Fetching URL:", url); // Log the API URL

  try {
    // Pass revalidation option in Next.js format
    const response = await safeFetch(url, { 
      next: { revalidate: revalidateTime }
    });

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
export async function fetchImageData(acfFields) {
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

export async function fetchSiteIcon(revalidateTime = 86400) { // 1 day default
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/`;

  try {
    const response = await safeFetch(
      url, 
      { next: { revalidate: revalidateTime } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // console.log(`icon data: ${data.site_icon_url}`);
    return data.site_icon_url;
  } catch (error) {
    console.error("Error fetching site icon:", error);
    return null;
  }
}

export async function getPostsByPage(page = 1, perPage = 3) {
  try {
    const response = await safeFetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}posts?page=${page}&per_page=${perPage}&_embed&order=desc&orderby=date`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers?.get('X-WP-TotalPages') || '1', 10);
    const totalPosts = parseInt(response.headers?.get('X-WP-Total') || '0', 10);
    
    // Process posts to include featured image and other data
    const processedPosts = posts.map(post => {
      // Get featured image if available
      let featuredImage = null;
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        const media = post._embedded['wp:featuredmedia'][0];
        featuredImage = {
          id: media.id,
          alt: media.alt_text || '',
          sizes: media.media_details?.sizes || {},
          full: media.source_url
        };
      }
      
      return {
        id: post.id,
        title: post.title?.rendered || '',
        content: post.content?.rendered || '',
        excerpt: post.excerpt?.rendered || '',
        date: post.date,
        slug: post.slug,
        featuredImage
      };
    });
    
    return {
      posts: processedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts
      }
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { 
      posts: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0
      }
    };
  }
}

export async function getPostBySlug(slug) {
  try {
    const response = await safeFetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}posts?slug=${slug}&_embed`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    const posts = await response.json();
    
    if (!posts || posts.length === 0) {
      return null;
    }

    const post = posts[0];
    
    // Get featured image if available
    let featuredImage = null;
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      const media = post._embedded['wp:featuredmedia'][0];
      featuredImage = {
        id: media.id,
        alt: media.alt_text || '',
        sizes: media.media_details?.sizes || {},
        full: media.source_url
      };
    }
    
    return {
      id: post.id,
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      date: post.date,
      slug: post.slug,
      featuredImage
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}
