import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { Suspense } from 'react';
import Loading from '@/components/loading/Loading';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<Loading />}>
          <CartProvider>
            {children}
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}
