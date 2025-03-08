import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import HomePage from '@/components/HomePage';
import { notFound } from 'next/navigation';

export default async function Page() {
  // Fetch data on the server
  const pageData = await getPageFieldsByName("homepage");
  const headerData = await getPageFieldsByName("header");
  const footerData = await getPageFieldsByName("footer");
  const siteIconUrl = await fetchSiteIcon();

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <HomePage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
    />
  );
}
