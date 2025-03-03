'use client';

import { useEffect, useState } from "react";
import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import PaymentPage from '@/components/checkout/PaymentPage';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check if we have form data in session storage
        const formData = sessionStorage.getItem('checkoutFormData');
        if (!formData) {
          // If no data, redirect back to checkout
          router.push('/checkout');
          return;
        }

        const [headerData, footerData, abonnementPageData, siteIconUrl] = await Promise.all([
          getPageFieldsByName("header"),
          getPageFieldsByName("footer"),
          getPageFieldsByName("abonnement"),
          fetchSiteIcon()
        ]);

        if (!headerData || !footerData) {
          console.error("Data not found.");
          return;
        }

        setPageData({
          headerData,
          footerData,
          abonnementPageData,
          siteIconUrl
        });
      } catch (error) {
        console.error("Error loading data:", error);
        router.push('/checkout');
      }
    }

    fetchData();
  }, [router]);

  // Only render the PaymentPage when we have data
  if (!pageData) {
    return null; // Let the LoadingWrapper handle the loading UI
  }

  return (
    <PaymentPage
      headerData={pageData.headerData}
      footerData={pageData.footerData}
      abonnementPageData={pageData.abonnementPageData}
      siteIconUrl={pageData.siteIconUrl}
    />
  );
}
