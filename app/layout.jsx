import '@/styles/globals.css';
import LoadingWrapper from '@/components/loading/LoadingWrapper';
import { CartProvider } from '@/context/CartContext';
import { Suspense } from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <LoadingWrapper />
          </Suspense>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
