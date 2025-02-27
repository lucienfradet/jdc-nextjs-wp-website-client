import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import CheckoutPage from '@/components/checkout/CheckoutPage';

export default async function Page() {
  // Fetch data on the server
  const [headerData, footerData, siteIconUrl, pointsRes] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon(),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/point_de_chute`, { cache: "no-store" })
  ]);

  if (!headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    return {
      notFound: true,
    };
  }

  if (!pointsRes.ok) {
    console.error("Error fetching point de chute data");
  }

  const pointDeChute = await pointsRes.json();

  return (
    <CheckoutPage
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
      pointDeChute={pointDeChute}
    />
  );
}
