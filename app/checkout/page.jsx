'use client';

import { useState, useEffect } from 'react';
import { getPageFieldsByName } from '@/lib/api';
import { fetchSiteIcon } from "@/lib/api";
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { notFound } from 'next/navigation';

export default function Page() {
  const [pageData, setPageData] = useState(null);
  const [savedFormData, setSavedFormData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [headerData, footerData, abonnementPageData, siteIconUrl, pointsRes] = await Promise.all([
          getPageFieldsByName("header"),
          getPageFieldsByName("footer"),
          getPageFieldsByName("abonnement"),
          fetchSiteIcon(),
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/point_de_chute`, { cache: "no-store" })
        ]);

        if (!headerData || !footerData) {
          console.error("Data not found.");
          notFound();
        }

        if (!pointsRes.ok) {
          console.error("Error fetching point de chute data");
        }

        const pointDeChute = await pointsRes.json();

        setPageData({
          headerData,
          footerData,
          abonnementPageData,
          siteIconUrl,
          pointDeChute
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    fetchData();


    const loadSavedFormData = () => {
      try {
        const storedFormData = sessionStorage.getItem('checkoutFormData');
        if (storedFormData) {
          setSavedFormData(JSON.parse(storedFormData));
        }
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    };

    loadSavedFormData();
  }, []);

  // Only render the CheckoutPage when we have data
  if (!pageData) {
    return null; // Let the LoadingWrapper handle the loading UI
  }


  return (
    <CheckoutPage
      headerData={pageData.headerData}
      footerData={pageData.footerData}
      abonnementPageData={pageData.abonnementPageData}
      siteIconUrl={pageData.siteIconUrl}
      pointDeChute={pageData.pointDeChute}
      savedFormData={savedFormData}
    />
  );
}
