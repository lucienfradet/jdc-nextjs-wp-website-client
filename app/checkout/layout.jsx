const metaTitle = "Finaliser votre commande"; 
const metaDescription = "Page de caisse pour le Jardin des chefs.";

export const metadata = {
  title: metaTitle,
  description: metaDescription,
  alternates: {
    canonical: `/checkout`,
  },
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    url: `/checkout`,
  },
};

export default function CheckoutLayout({ children }) {
  return children;
}
