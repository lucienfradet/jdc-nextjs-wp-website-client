import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import Abonnement from '@/components/Abonnement';

export default async function Page() {
  // Fetch data on the server
  const pageData = await getPageFieldsByName("abonnement");
  const headerData = await getPageFieldsByName("header");
  const footerData = await getPageFieldsByName("footer");
  const siteIconUrl = await fetchSiteIcon();

  if (!pageData || !headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    return {
      notFound: true,
    };
  }

  return (
    <Abonnement
      pageData={pageData}
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
    />
  );
}
