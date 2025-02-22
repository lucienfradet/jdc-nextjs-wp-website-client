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
    const acfFields = { ...page.acf };
    const title = page.title?.rendered || '';

    await fetchImageData(acfFields);

    return {
      id: page.id,
      title,
      acfFields,
    };
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

// Function to fetch image data for numeric ACF fields
async function fetchImageData(acfFields) {
  const fieldKeys = Object.keys(acfFields);

  for (const key of fieldKeys) {
    const value = acfFields[key];

    if (typeof value === 'number') {
      try {
        const response = await safeFetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}media/${value}?_fields=id,source_url,alt_text`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const mediaItem = await response.json();

        acfFields[key] = {
          id: mediaItem.id,
          src: mediaItem.source_url,
          alt: mediaItem.alt_text || ''
        };
      } catch (error) {
        console.error(`Error fetching image data for field "${key}":`, error);
      }
    }
  }
}

export async function fetchSiteIcon() {
  const url = `${process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL}wp-json/`;

  try {
    const response = await safeFetch(url);
    const data = await response.json();
    console.log(`icon data: ${data.site_icon_url}`);
    return data.site_icon_url;
  } catch (error) {
    console.error("Error fetching site icon:", error);
    return null;
  }
}
