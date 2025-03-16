import { getPostsByPage, getPageFieldsByName } from '@/lib/api';
import EventsPage from '@/components/events/EventsPage';
import { notFound } from 'next/navigation';

// Enable dynamic parameters
export const dynamic = 'force-dynamic'; // This ensures the page is not statically generated and respects the searchParams

// Set revalidation time
export const revalidate = 3600; // Revalidate every hour

// Generate dynamic metadata based on current page
export async function generateMetadata({ searchParams }) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);
  
  const metaTitle = "Blog et Événements";
  const metaDescription = `Découvrez toute l'actualité de notre ferme à travers
  notre page Blog et Événements. Restez informé des dernières nouvelles, des
  récoltes saisonnières et des événements à venir. Ateliers culinaires, journées
  portes ouvertes, marchés spéciaux... Ne manquez aucune occasion de nous
  rencontrer et de découvrir nos produits frais et locaux. Consultez
  régulièrement cette page pour suivre notre aventure agricole et participer à la
  vie de notre ferme!`;
  
  const canonical = currentPage > 1 
    ? `/evenements?page=${currentPage}` 
    : '/evenements';
  
  return {
    title: currentPage > 1 ? `${metaTitle} - Page ${currentPage}` : metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonical,
    },
    openGraph: {
      title: currentPage > 1 ? `${metaTitle} - Page ${currentPage}` : metaTitle,
      description: metaDescription,
      url: canonical,
    },
  };
}

export default async function EventsPageRoute({ searchParams }) {
  // Get current page from URL or default to 1
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  // Fetch page data and posts in parallel
  const [headerData, footerData, postsData] = await Promise.all([
    getPageFieldsByName("header"),
    getPageFieldsByName("footer"),
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
      postsData={postsData}
    />
  );
}
