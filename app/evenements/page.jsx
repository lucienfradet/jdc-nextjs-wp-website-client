import { getPostsByPage, getPageFieldsByName, fetchSiteIcon } from '@/lib/api';
import EventsPage from '@/components/events/EventsPage';
import { notFound } from 'next/navigation';

// Enable dynamic parameters
export const dynamic = 'force-dynamic'; // This ensures the page is not statically generated and respects the searchParams

// Set revalidation time
export const revalidate = 3600; // Revalidate every hour

export default async function EventsPageRoute({ searchParams }) {
  // Get current page from URL or default to 1
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Fetch page data and posts in parallel
  const [headerData, footerData, siteIconUrl, postsData] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon(),
    getPostsByPage(currentPage, 3)
  ]);

  if (!headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <EventsPage
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
      postsData={postsData}
      currentPage={currentPage}
    />
  );
}
