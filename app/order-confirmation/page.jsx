import { Suspense } from 'react';
import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import OrderConfirmationPage from '@/components/order/OrderConfirmationPage';
import { notFound } from 'next/navigation';

const metaTitle = "Confirmation de commande";
const metaDescription = `Merci pour votre commande!`;

export const metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: "/order-confirmation",
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: "/order-confirmation",
  },
};

export default async function Page() {
  // Fetch data on the server
  const [pageData, headerData, footerData, siteIconUrl] = await Promise.all([
    getPageFieldsByName("confirmation-de-commande"),
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
        pageData={pageData}
        headerData={headerData}
        footerData={footerData}
        siteIconUrl={siteIconUrl}
      />
    </Suspense>
  );
}
