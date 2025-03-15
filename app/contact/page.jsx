import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import ContactPage from '@/components/ContactPage';
import { notFound } from 'next/navigation';

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("contact"),
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon()
  ]);

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <ContactPage
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
      mapsApiKey={mapsApiKey}
    />
  );
}
