import '@/styles/globals.css';
import LoadingWrapper from '@/components/loading/LoadingWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LoadingWrapper />
        {children}
      </body>
    </html>
  );
}
