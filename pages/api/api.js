import { GraphQLClient } from 'graphql-request';

const endpoint = `${process.env.PUBLIC_WORDPRESS_GRAPHQL_URL}`;

const graphQLClient = new GraphQLClient(endpoint);

export async function getAllPosts() {
  const query = `
    {
      posts {
        nodes {
          id
          title
          content
        }
      }
    }
  `;
  const data = await graphQLClient.request(query);
  return data.posts.nodes;
}

export async function getPageFieldsByName(name) {
  const url = `${process.env.PUBLIC_WORDPRESS_API_URL}pages?slug=${name}`;

  try {
    // Fetch data from the REST API
    const response = await fetch(url);

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

    // Check if the field value is a number (indicating a media ID)
    if (typeof value === 'number') {
      try {
        // Fetch image details using GraphQL
        const query = `
          query GetMedia($id: ID!) {
            mediaItem(id: $id, idType: DATABASE_ID) {
              id
              sourceUrl
              altText
            }
          }
        `;

        const variables = { id: value };

        const data = await graphQLClient.request(query, variables);

        // Replace the numeric field value with the fetched media details
        if (data.mediaItem) {
          acfFields[key] = {
            id: data.mediaItem.id,
            src: data.mediaItem.sourceUrl,
            alt: data.mediaItem.altText,
          };
        }
      } catch (error) {
        console.error(`Error fetching image data for field "${key}":`, error);
      }
    }
  }
}