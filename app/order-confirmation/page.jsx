import { Suspense } from 'react';
import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import OrderConfirmationPage from '@/components/order/OrderConfirmationPage';
import { notFound } from 'next/navigation';

export default async function Page() {
  // Fetch data on the server
  const [headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
    fetchSiteIcon()
  ]);

  if (!headerData || !footerData) {
    console.error("Data not found. Returning 404.");
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading order details...</div>}>
      <OrderConfirmationPage
        headerData={headerData}
        footerData={footerData}
        siteIconUrl={siteIconUrl}
      />
    </Suspense>
  );
}
