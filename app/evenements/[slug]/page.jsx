import { getPostBySlug, getPageFieldsByName, fetchSiteIcon } from '@/lib/api';
import EventDetailPage from '@/components/events/EventDetailPage';
import { notFound } from 'next/navigation';

// Enable dynamic parameters
export const dynamicParams = true;

// Set revalidation time
export const revalidate = 3600; // Revalidate every hour

export default async function EventPage({ params }) {
  const { slug } = await params;
  
  // Fetch page data and post in parallel
  const [headerData, footerData, siteIconUrl, post] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon(),
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
      siteIconUrl={siteIconUrl}
      post={post}
    />
  );
}
