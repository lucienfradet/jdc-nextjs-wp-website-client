import { useEffect, useState } from "react";
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/DesktopHeader";
import MobileHeader from "@/components/MobileHeader";
import DesktopFooter from "@/components/DesktopFooter";
import MobileFooter from "@/components/MobileFooter";
import styles from '@/styles/abonnement.module.css';
import { getPageFieldsByName } from '@/pages/api/api';
import { fetchSiteIcon } from "@/pages/api/api";
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
  const siteIconUrl = await fetchSiteIcon();

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
      siteIconUrl
    },
    // amount of time that needs to pass (in seconds) before next.js re-fetches the data
    // if not set, any changes to the CMS won't take effect until the app is rebuilt manually!
    // revalidate: 60,
  };
};

export default function Abonnement({ pageData, headerData, footerData, siteIconUrl }) {
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
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.Body}>
        <section className={styles.introSection}>
          <h2>{pageContent["intro-title"]}</h2>
          <div className={styles.introContainer}>
            <div className={styles.containerLeft}>
              <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraphe-explicatif"]) }}></p>
            </div>
            <div className={styles.containerRight}>
              <img src={pageContent["intro-img"].src} alt={pageContent["intro-img"].alt} />
            </div>
          </div>
        </section>

        <section className={styles.bonifSection}>
          <div className={styles.bonifContainer}>
            <div className={styles.containerLeft}>
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

                <div className={styles.suplementaire}>Suplémentaire</div>
              </div>
            <img src={pageContent["bonif-img"].src} alt={pageContent["bonif-img"].alt} />
            </div>

            <div className={styles.containerRight}>
              <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraphe-explicatif-bonif"]) }}></p>
            </div>
          </div>

          <svg width="3929" height="937" viewBox="0 0 3929 937" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M35 739.5C35 739.5 682.5 197.549 1151 279C1299.33 304.788 1330.86 526.561 1469.5 585.256C1738.59 699.178 1741.96 -51.8941 2009 66.7557C2218.77 159.959 1977.52 658.674 2204 621.256C2334.79 599.646 2366.63 384.176 2499 377C3177 340.244 3896 894 3896 894" stroke="url(#paint0_linear_291_82)" strokeWidth="107"/>
            <defs>
              <linearGradient id="paint0_linear_291_82" x1="35" y1="383.5" x2="3856.5" y2="383.945" gradientUnits="userSpaceOnUse">
                <stop offset="0.0433595" stopColor="#24311B" stopOpacity="0"/>
                <stop offset="0.305" stopColor="#24311B"/>
                <stop offset="0.74" stopColor="#F5F0E1"/>
                <stop offset="0.884955" stopColor="#F5F0E1" stopOpacity="0"/>
              </linearGradient>
            </defs>
          </svg>
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
