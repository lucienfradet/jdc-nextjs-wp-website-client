import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import OrderConfirmationPage from '@/components/order/OrderConfirmationPage';

export default async function Page() {
  // Fetch data on the server
  const [headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon()
  ]);

  if (!headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    return {
      notFound: true,
    };
  }

  return (
    <OrderConfirmationPage
      headerData={headerData}
      footerData={footerData}
      siteIconUrl={siteIconUrl}
    />
  );
}
