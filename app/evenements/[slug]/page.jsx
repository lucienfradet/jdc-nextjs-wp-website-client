import { getPageFieldsByName } from '@/lib/api';
import { getPostBySlug } from '@/lib/cachedApi';
import EventDetailPage from '@/components/events/EventDetailPage';
import { notFound } from 'next/navigation';
import { createMetaDescription } from '@/lib/textUtils';

// Enable dynamic parameters
export const dynamicParams = true;

// Set revalidation time
export const revalidate = 3600; // Revalidate every hour

// Generate metadata based on CMS data
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);
  
  if (!post) {
    return null;
  }

  const { title, content } = post;

  let excerpt = createMetaDescription(content);

  if (!excerpt) {
    excerpt = "Publication par le Jardin des chefs." 
  }

  return {
    title: title,
    description: excerpt,
    alternates: {
      canonical: `/evenements/${title}`,
    },
    openGraph: {
      title: title,
      description: excerpt,
      url: `/evenements/${title}`,
    },
  };
}

export default async function EventPage({ params }) {
  const { slug } = await params;
  
  // Fetch page data and post in parallel
  const [headerData, footerData, post] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    getPostBySlug(slug)
  ]);

  if (!headerData || !footerData || !post) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <EventDetailPage
      headerData={headerData}
      footerData={footerData}
      post={post}
    />
  );
}
