import App from 'next/app';
import "../styles/globals.css";
import { getPageFieldsByName } from './api/api.js';
  
// Interesting thing here:
// If I understant correctly, the data from Header and Footer, even though they are called on 
// every page using getStaticProps, will not be fetched again if it hasn't changed.
// Only the new Component {...pageProps} of the new page will be fetched. I think
// Next.js handles this automatically.
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp
