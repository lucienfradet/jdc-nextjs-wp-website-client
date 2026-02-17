import { safeFetch } from "@/lib/sslConfig";

// Convention: only treat fields ending in these suffixes as image IDs
function isImageField(key) {
  return (
    key.startsWith('img-') ||
    key.startsWith('logo-') ||
    key.startsWith('image-') ||
    key.endsWith('-img') ||
    key.endsWith('-logo') ||
    key.endsWith('-image')
  );
}

function isValidMediaId(value) {
  return Number.isInteger(value) && value > 0 && value < 1_000_000_000;
}

// Run promises in batches to avoid hammering the WP API
async function batchedPromiseAll(items, asyncFn, batchSize = 5) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(asyncFn));
    results.push(...batchResults);
  }
  return results;
}

export async function getPageFieldsByName(name, revalidateTime = 3600) {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}pages?slug=${name}`;

  try {
    const response = await safeFetch(url, {
      next: { revalidate: revalidateTime }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page data: ${response.statusText}`);
    }

    const pages = await response.json();

    if (!pages || pages.length === 0) {
      throw new Error(`No page found with the slug: ${name}`);
    }

    const page = pages[0];

    if (!page.acf) {
      throw new Error(`No ACF fields found for the page: ${name}`);
    }

    const rawAcfFields = { ...page.acf };
    const processedAcfFields = await fetchImageData(rawAcfFields, revalidateTime);

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

export async function fetchImageData(acfFields, revalidateTime = 3600) {
  const processedFields = { ...acfFields };
  await processRecursively(processedFields, null);
  return processedFields;

  async function processRecursively(obj, parentKey) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      // For arrays, we only process items if the parent key suggests images
      const entries = obj.map((item, index) => ({ item, index }));
      await batchedPromiseAll(entries, async ({ item, index }) => {
        if (typeof item === 'number' && isValidMediaId(item) && isImageField(parentKey ?? '')) {
          obj[index] = await processImageId(item, `array item at index ${index}`, revalidateTime);
        } else if (typeof item === 'object' && item !== null) {
          await processRecursively(item, parentKey);
        }
      });
    } else {
      const entries = Object.entries(obj);
      await batchedPromiseAll(entries, async ([key, value]) => {
        if (typeof value === 'number' && isValidMediaId(value) && isImageField(key)) {
          obj[key] = await processImageId(value, `field "${key}"`, revalidateTime);
        } else if (typeof value === 'object' && value !== null) {
          await processRecursively(value, key);
        }
      });
    }
  }

  async function processImageId(value, fieldDescription, revalidateTime) {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await safeFetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}media/${value}?_fields=id,alt_text,media_details,source_url`,
          { next: { revalidate: revalidateTime } }
        );

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const mediaItem = await response.json();
        const { id, alt_text, media_details, source_url } = mediaItem;

        if (!media_details?.sizes) {
          return createFallbackImageData(id, alt_text, source_url, media_details);
        }

        return createImageDataObject(id, alt_text, media_details, source_url);
      } catch (error) {
        if (attempt === maxRetries) {
          // Return original value instead of corrupting with error object
          console.error(`Failed to process ${fieldDescription} after ${maxRetries} attempts:`, error.message);
          return value;
        }
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }
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

export async function fetchSiteIcon(revalidateTime = 86400) {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/`;

  try {
    const response = await safeFetch(url, { next: { revalidate: revalidateTime } });

    if (!response.ok) return null;

    const data = await response.json();
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

    if (!response.ok) throw new Error('Failed to fetch posts');

    const posts = await response.json();
    const totalPages = parseInt(response.headers?.get('X-WP-TotalPages') || '1', 10);
    const totalPosts = parseInt(response.headers?.get('X-WP-Total') || '0', 10);

    const processedPosts = posts.map(post => ({
      id: post.id,
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      date: post.date,
      slug: post.slug,
      featuredImage: extractFeaturedImage(post)
    }));

    return {
      posts: processedPosts,
      pagination: { currentPage: page, totalPages, totalPosts }
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      posts: [],
      pagination: { currentPage: 1, totalPages: 1, totalPosts: 0 }
    };
  }
}

export async function getPostBySlug(slug) {
  try {
    const response = await safeFetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}posts?slug=${slug}&_embed`
    );

    if (!response.ok) throw new Error('Failed to fetch post');

    const posts = await response.json();
    if (!posts || posts.length === 0) return null;

    const post = posts[0];

    return {
      id: post.id,
      title: post.title?.rendered || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      date: post.date,
      slug: post.slug,
      featuredImage: extractFeaturedImage(post)
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

// Extracted shared helper to avoid duplication between getPostsByPage and getPostBySlug
function extractFeaturedImage(post) {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return null;
  return {
    id: media.id,
    alt: media.alt_text || '',
    sizes: media.media_details?.sizes || {},
    full: media.source_url
  };
}
