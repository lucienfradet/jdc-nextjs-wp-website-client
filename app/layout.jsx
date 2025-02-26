import '@/styles/globals.css';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import { CartProvider } from '@/context/CartContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <LoadingWrapper />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
