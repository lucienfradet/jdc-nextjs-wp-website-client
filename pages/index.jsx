import { useEffect, useRef } from "react";
import CustomHead from '../components/CustomHead';
import styles from '../styles/Homepage.module.css';
import { getPageFieldsByName } from './api/api';
import { convertLineBreaksToHtml } from '../utils/textUtils';

// getStaticProps gets called on pages (in the pages dir)
// It fetches static data to be rendered client side.
// because header and footer are components, they can't use this function.
// the data needs to be fetchs by every page and passed into the pageProps (props) object
// _app.js has access to this object and can pass the data to the components.
export const getStaticProps = async () => {
  const pageData = await getPageFieldsByName("homepage");
  const headerData = await getPageFieldsByName("header");
  const footerData = await getPageFieldsByName("footer");

  if (!pageData) {
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

export default function MainPage({ pageData }) {
  const pageContent = pageData.acfFields;

  // debug statement
  console.log("Page Content:", pageContent);

  // Detect <br> and adjust second line
  const catchPhraseRef = useRef(null);
  useEffect(() => {
    if (catchPhraseRef.current) {
      const brExists = catchPhraseRef.current.innerHTML.includes("<br>");
      if (brExists) {
        const lines = catchPhraseRef.current.innerHTML.split("<br>");
        catchPhraseRef.current.innerHTML = `
          ${lines[0]}<br>
          <span class="${styles.secondLine}">${lines[1]}</span>
        `;
      }
    }
  }, []);

  return (
    <>
      <CustomHead
        title={pageContent["head-title"]}
        description={pageContent["head-description"]}
        canonicalUrl={pageContent["head-url"]}
      />
      <div className={styles.homepageBody}>
        <section className={styles.titleSection}>
          <div className={styles.logoWrapper}>
            <img src={pageContent["img-h1"].src} alt={pageContent["img-h1"].alt} className={styles.h1Logo} />
            <img src={pageContent["img-h1-hollow"].src} alt={pageContent["img-h1-hollow"].alt} className={styles.h1LogoHollow} />
            <img src={pageContent["img-h1-hollow"].src} alt={pageContent["img-h1-hollow"].alt} className={styles.h1LogoHollow} />
            <img src={pageContent["img-h1-hollow"].src} alt={pageContent["img-h1-hollow"].alt} className={styles.h1LogoHollow} />
            <img src={pageContent["img-h1-hollow"].src} alt={pageContent["img-h1-hollow"].alt} className={styles.h1LogoHollow} />
          </div>
          <div className={styles.catchPhrase}>
            <p ref={catchPhraseRef} dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["catch-phrase"]) }}></p>
          </div>
        </section>
        <section className={styles.introSection}>
          <div className={styles.introContainer}>
            <div className={styles.imgCrewContainer}>
              <img className={styles.imgCrew} src={pageContent["img-crew"].src} alt={pageContent["img-crew"].alt} />
              <p className={styles.labelImg} dangerouslySetInnerHTML={{ __html: pageContent["label-img"] }}></p>
            </div>
            <div className={styles.introTextContainer}>
              <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraph-intro"]) }}></p>
              <p className={styles.introBold} dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraph-intro-bold"]) }}></p>
              <img className={styles.imgLogoText} src={pageContent["logo-with-text"].src} alt={pageContent["logo-with-text"].alt} />
            </div>
            <img className={styles.imageSide} src={pageContent["img-side-left"].src} alt={pageContent["img-side-left"].alt} />

            <svg className={styles.backgroundSVG} xmlns="http://www.w3.org/2000/svg" width="812" height="990" viewBox="0 0 812 990" fill="none">
              <path d="M657.843 38C618.676 159.667 1140.53 586.727 245.5 447C-331 357 482 634.5 459.343 952" stroke="url(#paint0_linear_116_245)" stroke-width="75" stroke-linecap="round"/>
              <defs>
                <linearGradient id="paint0_linear_116_245" x1="264.356" y1="38" x2="264.356" y2="902.003" gradientUnits="userSpaceOnUse">
                  <stop offset="0.29" stop-color="#D17829"/>
                  <stop offset="1" stop-color="#24311B"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>
        <section className={styles.produitsSection}>
          <div className={styles.produitsContainer}>
            <h2>{pageContent["h2-produits"]}</h2>
            <div className={styles.columnsWrapper}>
              <div className={styles.column}>
                <h3>{pageContent["h3-en-saison"]}</h3>
                <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraph-en-saison"]) }}></p>
              </div>
              <div className={styles.column}>
                <h3>{pageContent["h3-en-hiver"]}</h3>
                <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraph-en-hiver"]) }}></p>
              </div>
            </div>
            <img
              className={styles.imgProduits}
              src={pageContent["img-produits"].src} alt={pageContent["img-produits"].alt}
            />
          </div>
        </section>
        <section className={styles.collabSection}>
          <svg className={styles.collabSVG} xmlns="http://www.w3.org/2000/svg" width="1766" height="638" viewBox="0 0 1766 638" fill="none">
            <path d="M43.7062 221.241C-32.7938 180.5 289.604 75.0716 318.206 250.5C342.216 397.759 80.9928 509.928 190.206 587.5C350.706 701.5 477.304 240.743 655.263 311.515C749.247 348.892 728.538 439.52 825.359 451.273C956.919 467.243 961.832 70.5473 1088.39 127.624C1164.92 162.134 1149.78 349.903 1229.56 352.975C1298.3 355.621 1303.83 208.471 1372.03 195.162C1445.33 180.859 1471.48 319.259 1545.2 311.515C1647.62 300.756 1733.71 32 1733.71 32" stroke="url(#paint0_linear_208_80)" stroke-width="63" stroke-linecap="round"/>
            <defs>
              <linearGradient id="paint0_linear_208_80" x1="401.428" y1="-363.684" x2="1554.7" y2="350.256" gradientUnits="userSpaceOnUse">
                <stop offset="0.2449" stop-color="#A22D22"/>
                <stop offset="0.245" stop-color="#153C66"/>
                <stop offset="0.535" stop-color="#153C66"/>
                <stop offset="0.5351" stop-color="#24311B"/>
                <stop offset="0.785" stop-color="#24311B"/>
                <stop offset="0.7851" stop-color="#C17C74"/>
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.collabContainer}>
            <div className={styles.collabTextContainer}>
              <img className={styles.imgLogoNFriends} src={pageContent["img-jdc-n-friends"].src} alt={pageContent["img-jdc-n-friends"].alt} />
              <h2>{pageContent["h2-collaborateurs"]}</h2>
              {/* dynamic implementation of collaborators */}
              {
                Object.keys(pageContent)
                .filter((key) => key.startsWith("text-collaborateur-"))
                .map((key) => {
                  const collaboratorIndex = key.split("-").pop(); // Extract the index from the key
                  const text = pageContent[key];
                  const urlKey = `url-collaborateur-${collaboratorIndex}`;
                  const url = pageContent[urlKey];

                  // check if empty
                  if (text && text.trim()) {
                    const [linkText, ...rest] = text.split(",");
                    return (
                      <p key={key}>
                        {/* also check if empty */}
                        {url && url.trim() ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {linkText.trim()}
                          </a>
                        ) : (
                            linkText.trim()
                          )}
                        {rest.length > 0 ? `, ${rest.join(",").trim()}` : ""}
                      </p>
                    );
                  }
                  return null; // Skip if text is empty
                })
              }
            </div>
          </div>
          <img className={styles.imgCollabBackground} src={pageContent["img-collaborateurs-background"].src} alt={pageContent["img-collaborateurs-background"].alt} />
        </section>
        <section className={styles.abonnSection}>
          <div className={styles.abonnContainer}>
            <h2>{pageContent["h2-abonnements"]}</h2>
            <p dangerouslySetInnerHTML={{ __html: convertLineBreaksToHtml(pageContent["paragraph-abonnements"]) }}></p>
            <button className={styles.abonnButton}>{pageContent["btn-abonnements-text"]}</button>
          </div>
          <div className={styles.absolutesWrapper}>
            <img className={styles.imgAbonn1} src={pageContent["img-abonnements-1"].src} alt={pageContent["img-abonnements-1"].alt} />
            <img className={styles.imgAbonn2} src={pageContent["img-abonnements-2"].src} alt={pageContent["img-abonnements-2"].alt} />
            <svg className={styles.abonnSVG1} width="413" height="415" viewBox="0 0 413 415" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.6302 60.2784C22.1162 44.5451 34.2468 31.91 49.9065 29.7844L261.268 1.09497C275.029 -0.77292 288.543 5.91607 295.403 17.9908L407.998 216.175C415.43 229.255 413.381 245.665 402.962 256.517L261.555 403.806C251.136 414.658 234.824 417.373 221.451 410.481L18.8458 306.052C6.50165 299.689 -0.732243 286.459 0.57359 272.633L20.6302 60.2784Z" fill="#D17829"/>
            </svg>
            <svg className={styles.abonnSVG2} width="515" height="543" viewBox="0 0 515 543" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M216.599 19.4479C238.141 -5.54192 276.859 -5.54195 298.401 19.4479L352.594 82.3149C361.153 92.2439 373.031 98.7205 386.014 100.537L467.979 112.003C503.138 116.921 524.067 153.848 510.223 186.539L483.162 250.443C477.462 263.902 477.462 279.098 483.162 292.557L510.223 356.461C524.067 389.152 503.138 426.079 467.979 430.997L386.014 442.463C373.031 444.28 361.153 450.756 352.594 460.685L298.401 523.552C276.859 548.542 238.141 548.542 216.599 523.552L162.406 460.685C153.847 450.756 141.969 444.28 128.986 442.463L47.0209 430.997C11.8615 426.079 -9.06694 389.152 4.77675 356.461L31.8381 292.557C37.5377 279.098 37.5377 263.902 31.8381 250.443L4.77676 186.539C-9.06694 153.848 11.8616 116.921 47.0209 112.003L128.986 100.537C141.969 98.7205 153.847 92.2439 162.406 82.3149L216.599 19.4479Z" fill="#153C66"/>
            </svg>
          </div>
        </section>
      </div>
    </>
  );
}
