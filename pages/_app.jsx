import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Loading from "@/components/Loading";
import "@/styles/globals.css";
import loadingStyles from "@/styles/Loading.module.css"; // Import the CSS module

// Interesting thing here:
// If I understant correctly, the data from Header and Footer, even though they are called on 
// every page using getStaticProps, will not be fetched again if it hasn't changed.
// Only the new Component {...pageProps} of the new page will be fetched. I think
// Next.js handles this automatically.
function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false); // Track the fade-out state
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setFadeOut(false); // Reset fade-out on page load start
    };
    const handleComplete = () => {
      // Trigger the fade-out effect before hiding the loader
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false); // Hide the loader after fade-out is complete
      }, 500); // Duration of the fade-out
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <>
      {loading && (
        <div
          className={`${loadingStyles["loading-container"]} ${fadeOut ? loadingStyles["fade-out"] : ""}`}
        >
          <Loading />
        </div>
      )}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp
