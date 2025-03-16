const metaTitle = "Paiement"; 
const metaDescription = "Page de paiement pour le Jardin des chefs.";

export const metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: `/payment`,
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: `/payment`,
  },
};

export default function CheckoutLayout({ children }) {
  return children;
}
