import { useEffect, useRef, useState } from "react";
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/DesktopHeader";
import MobileHeader from "@/components/MobileHeader";
import DesktopFooter from "@/components/DesktopFooter";
import MobileFooter from "@/components/MobileFooter";
import styles from '@/styles/abonnement.module.css';
import { getPageFieldsByName } from '@/pages/api/api';
import { convertLineBreaksToHtml } from '../utils/textUtils';

// getStaticProps gets called on pages (in the pages dir)
// It fetches static data to be rendered client side.
// because header and footer are components, they can't use this function.
// the data needs to be fetchs by every page and passed into the pageProps (props) object
// _app.js has access to this object and can pass the data to the components.
export const getStaticProps = async () => {
  const pageData = await getPageFieldsByName("abonnement");
  const headerData = await getPageFieldsByName("header");
  const footerData = await getPageFieldsByName("footer");

  // Simulate a delay like a slow API call
  // await new Promise((resolve) => setTimeout(resolve, 6000)); // 3 seconds

  if (!pageData || !headerData || !footerData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      pageData,
      headerData,
      footerData,
    },
    // amount of time that needs to pass (in seconds) before next.js re-fetches the data
    // if not set, any changes to the CMS won't take effect until the app is rebuilt manually!
    // revalidate: 60,
  };
};

export default function MainPage({ pageData, headerData, footerData }) {
  const pageContent = pageData.acfFields;
  // debug statement
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991); // Define breakpoint for mobile/tablet
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <CustomHead
        title={pageContent["head-title"]}
        description={pageContent["head-description"]}
        canonicalUrl={pageContent["head-url"]}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.Body}>
        <section className={styles.introSection}>
          <h2>{pageContent["head-title"]}</h2>
          <div className={styles.introContainer}>
            <div className={styles.textSide}>
              <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraphe-explicatif"]) }}></p>
            </div>
            <div className={styles.imgSide}>
              <img src={pageContent["head-img"].src} alt={pageContent["head-img"].alt} />
            </div>
          </div>
        </section>

        <section className={styles.bonifSection}>
          <div className={styles.bonifContainer}>
            <h2>{pageContent["bonif-title"]}</h2>

            <div className={styles.TableContainer}>
              {/* Row of 4 rectangles */}
              <div className={styles.rectanglesRow}>
                <div className={styles.rectangle}>{pageContent["forfaits-noms"]["forfait-1"]}</div>
                <div className={styles.rectangle}>{pageContent["forfaits-noms"]["forfait-2"]}</div>
                <div className={styles.rectangle}>{pageContent["forfaits-noms"]["forfait-3"]}</div>
                <div className={styles.rectangle}>{pageContent["forfaits-noms"]["forfait-4"]}</div>
              </div>

              {/* Row of values */}
              <div className={styles.valuesRow}>
                <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-1"]}</span>
                <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-2"]}</span>
                <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-3"]}</span>
                <span className={styles.value}>{pageContent["bonifications-pourcentage"]["bonif-4"]}</span>
              </div>

              <div className={styles.separator} />

              <div className={styles.supplementary}>Suplémentaire</div>
            </div>

            <img src={pageContent["bonif-img"].src} alt={pageContent["bonif-img"].alt} />
            <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraphe-explicatif-bonif"]) }}></p>

            <svg width="1440" height="702" viewBox="0 0 1440 702" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M-296 680.256C-296 680.256 -170.983 250.683 25 284.756C173.328 310.543 127.859 526.561 266.5 585.256C535.595 699.178 538.956 -51.8941 806 66.7557C1015.77 159.959 774.525 658.674 1001 621.256C1131.79 599.646 1113.11 398.654 1245 385.256C1408.75 368.621 1546 680.256 1546 680.256" stroke="url(#paint0_linear_154_1831)" stroke-width="107"/>
              <defs>
                <linearGradient id="paint0_linear_154_1831" x1="-296" y1="367.818" x2="1546" y2="368.125" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#24311B"/>
                  <stop offset="1" stop-color="#F5F0E1"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>

        <section className={styles.paimentSection}>
          <div className={styles.paimentContainer}>
            <h2>{pageContent["paiments-h1"]}</h2>
            <div className={styles.paimentWrapper}>
              <div className={styles.paimentTextSide}>
                <h3>{pageContent["paiments-virement-h2"]}</h3>
                <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paiments-virement-p"]) }}></p>
              </div>
              <div className={styles.paimentTextSide}>
                <h3>{pageContent["paiments-credit-h2"]}</h3>
                <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paiments-credit-p"]) }}></p>
              </div>
            </div>
          </div>
          <div className={styles.overlay}></div>
          <img className={styles.imgPaimentBackground} src={pageContent["img-paiments-background"].src} alt={pageContent["img-paiments-background"].alt} />
        </section>

        {isMobile ? (
          <MobileFooter pageData={footerData} />
        ) : (
            <DesktopFooter pageData={footerData} />
          )}
      </main>
    </>
  );
}
