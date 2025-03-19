"use client";

import { useEffect, useRef, useState } from "react";
import WPImage from "@/components/WPImage";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import HomePageSvgTitleSection from "@/components/svg/HomePageSvgTitleSection";
import EventsSection from "@/components/events/EventsSection";
import Link from "next/link";
import styles from '@/styles/HomePage.module.css';
import { convertLineBreaksToHtml, renderContent } from '@/lib/textUtils';

export default function HomePage({ pageData, headerData, footerData }) {
  const pageContent = pageData.acfFields;
  // debug statement
  // console.log("Page Content:", pageContent);

  const [isMobile, setIsMobile] = useState(false);
  const [opacity, setOpacity] = useState(1); // Start with full opacity
  const collabTextRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991); // Define breakpoint for mobile/tablet
    };

    // Change opacity of collab text element background with scroll distance from center
    const handleScroll = () => {
      if (!collabTextRef.current) return;

      const rect = collabTextRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate opacity based on how centered the element is
      const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - windowHeight / 2);
      const maxDistance = windowHeight / 5;

      const isMobileCSS = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--is-mobile'));

      // isMobile is constantly true and was removed from dependency because it was causing problems
      let newOpacity = isMobileCSS
        ? Math.max(0.2, 1 - (distanceFromCenter / maxDistance) * 0.3)
        : Math.max(0.6, 1 - (distanceFromCenter / maxDistance) * 0.3);

      setOpacity(newOpacity);
    };

    const handleMobileCatchPhrase = () => {
      const isMobileView = window.innerWidth <= 479;
      const catchPhraseElement = document.querySelector(`.${styles.catchPhrase}`);
      const introContainer = document.querySelector(`.${styles.introContainer}`);

      if (isMobileView && catchPhraseElement && introContainer) {
        // Clone the catchPhrase for mobile
        const mobileCatchPhrase = catchPhraseElement.cloneNode(true);
        mobileCatchPhrase.classList.remove(styles.catchPhrase);
        mobileCatchPhrase.classList.add(styles.mobileCatchPhrase);

        // Check if we already added mobile catchPhrase
        if (!introContainer.querySelector(`.${styles.mobileCatchPhrase}`)) {
          // Insert at the beginning of the intro container
          introContainer.insertBefore(mobileCatchPhrase, introContainer.firstChild);
        }
      } else {
        // Remove mobile catchPhrase if screen becomes larger
        const mobileCatchPhrase = document.querySelector(`.${styles.mobileCatchPhrase}`);
        if (mobileCatchPhrase) {
          mobileCatchPhrase.remove();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check in case the element is already in view

    handleMobileCatchPhrase();
    window.addEventListener('resize', handleMobileCatchPhrase);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('resize', handleMobileCatchPhrase);
    };
  }, []);

  // Detect <br> and adjust second line
  const catchPhraseRef = useRef(null);
  const [lines, setLines] = useState([]);
  useEffect(() => {
    if (catchPhraseRef.current) {
      const rawText = pageContent["catch-phrase"] || "";
      const processedText = convertLineBreaksToHtml(rawText);

      // Split the text by <br> if it exists
      const linesArray = processedText.split("<br>");

      // If no <br> is found, linesArray will have a single element
      setLines(linesArray);
    }
  }, []);

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.homepageBody}>
        <section className={styles.titleSection}>
          <div className={styles.logoWrapper}>
            {isMobile ? (
              <HomePageSvgTitleSection mobile={true} />
            ) : (
                <HomePageSvgTitleSection mobile={false} />
              )}
          </div>
          <div className={styles.catchPhrase}>
            <p ref={catchPhraseRef}>
              {lines[0]}
              {lines[1] && (
                <>
                  <br />
                  <span className={styles.secondLine}>{lines[1]}</span>
                </>
              )}
            </p>
          </div>
        </section>
        <section className={styles.introSection}>
          <div className={styles.introContainer}>
            <div className={styles.imgCrewContainer}>
              <WPImage className={styles.imgCrew} image={pageContent["img-crew"]} />
              <p className={styles.labelImg} dangerouslySetInnerHTML={{ __html: pageContent["label-img"] }}></p>
            </div>
            <div className={styles.introTextContainer}>
              {renderContent(pageContent["paragraph-intro"])}
              {renderContent(pageContent["paragraph-intro-bold"], styles.introBold)}
              <WPImage className={styles.imgLogoText} image={pageContent["logo-with-text"]} />
            </div>
            <WPImage className={styles.imageSide} image={pageContent["img-side-left"]} />

            <svg className={styles.backgroundSVG} xmlns="http://www.w3.org/2000/svg" width="812" height="990" viewBox="0 0 812 990" fill="none">
              <path d="M657.843 38C618.676 159.667 1140.53 586.727 245.5 447C-331 357 482 634.5 459.343 952" stroke="url(#paint0_linear_116_245)" strokeWidth="75" strokeLinecap="round"/>
              <defs>
                <linearGradient id="paint0_linear_116_245" x1="264.356" y1="38" x2="264.356" y2="902.003" gradientUnits="userSpaceOnUse">
                  <stop offset="0.29" stopColor="#D17829"/>
                  <stop offset="1" stopColor="#24311B"/>
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
                {renderContent(pageContent["paragraph-en-saison"])}
              </div>
              <div className={styles.column}>
                <h3>{pageContent["h3-en-hiver"]}</h3>
                {renderContent(pageContent["paragraph-en-hiver"])}
              </div>
            </div>
            <WPImage className={styles.imgProduits} image={pageContent["img-produits"]} />
          </div>
        </section>
        <section className={styles.collabSection}>
          <svg className={styles.collabSVG} xmlns="http://www.w3.org/2000/svg" width="1766" height="638" viewBox="0 0 1766 638" fill="none">
            <path d="M43.7062 221.241C-32.7938 180.5 289.604 75.0716 318.206 250.5C342.216 397.759 80.9928 509.928 190.206 587.5C350.706 701.5 477.304 240.743 655.263 311.515C749.247 348.892 728.538 439.52 825.359 451.273C956.919 467.243 961.832 70.5473 1088.39 127.624C1164.92 162.134 1149.78 349.903 1229.56 352.975C1298.3 355.621 1303.83 208.471 1372.03 195.162C1445.33 180.859 1471.48 319.259 1545.2 311.515C1647.62 300.756 1733.71 32 1733.71 32" stroke="url(#paint0_linear_208_80)" strokeWidth="63" strokeLinecap="round"/>
            <defs>
              <linearGradient id="paint0_linear_208_80" x1="401.428" y1="-363.684" x2="1554.7" y2="350.256" gradientUnits="userSpaceOnUse">
                <stop offset="0.2449" stopColor="#A22D22"/>
                <stop offset="0.245" stopColor="#153C66"/>
                <stop offset="0.535" stopColor="#153C66"/>
                <stop offset="0.5351" stopColor="#24311B"/>
                <stop offset="0.785" stopColor="#24311B"/>
                <stop offset="0.7851" stopColor="#C17C74"/>
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.collabContainer}>
            <div 
              ref={collabTextRef}
              className={styles.collabTextContainer}
              style={{ "--bg-opacity": opacity }}
            >
              <WPImage className={styles.imgLogoNFriends} image={pageContent["img-jdc-n-friends"]} />
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
          <div className={styles.imgCollabBackgroundContainer}>
            <WPImage className={styles.imgCollabBackground} image={pageContent["img-collaborateurs-background"]} forceFullSize={true} />
          </div>
        </section>

        <section className={styles.abonnSection}>
          <div className={styles.abonnContainer}>
            <div className={styles.textContent}>
              <h2>{pageContent["h2-abonnements"]}</h2>
              {renderContent(pageContent["paragraph-abonnements"])}
              <Link href={pageContent["btn-abonnements-url"] || "/abonnement"}>
                <button className={styles.abonnButton}>{pageContent["btn-abonnements-text"]}</button>
              </Link>
            </div>

            <div className={styles.imageGallery}>
              <WPImage className={styles.imgAbonn1} image={pageContent["img-abonnements-1"]} />
              <WPImage className={styles.imgAbonn2} image={pageContent["img-abonnements-2"]} />
            </div>
          </div>

          <div className={styles.backgroundElements}>
            <svg className={styles.abonnSVG1} width="413" height="415" viewBox="0 0 413 415" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.6302 60.2784C22.1162 44.5451 34.2468 31.91 49.9065 29.7844L261.268 1.09497C275.029 -0.77292 288.543 5.91607 295.403 17.9908L407.998 216.175C415.43 229.255 413.381 245.665 402.962 256.517L261.555 403.806C251.136 414.658 234.824 417.373 221.451 410.481L18.8458 306.052C6.50165 299.689 -0.732243 286.459 0.57359 272.633L20.6302 60.2784Z" fill="#D17829"/>
            </svg>
            <svg className={styles.abonnSVG2} width="515" height="543" viewBox="0 0 515 543" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M216.599 19.4479C238.141 -5.54192 276.859 -5.54195 298.401 19.4479L352.594 82.3149C361.153 92.2439 373.031 98.7205 386.014 100.537L467.979 112.003C503.138 116.921 524.067 153.848 510.223 186.539L483.162 250.443C477.462 263.902 477.462 279.098 483.162 292.557L510.223 356.461C524.067 389.152 503.138 426.079 467.979 430.997L386.014 442.463C373.031 444.28 361.153 450.756 352.594 460.685L298.401 523.552C276.859 548.542 238.141 548.542 216.599 523.552L162.406 460.685C153.847 450.756 141.969 444.28 128.986 442.463L47.0209 430.997C11.8615 426.079 -9.06694 389.152 4.77675 356.461L31.8381 292.557C37.5377 279.098 37.5377 263.902 31.8381 250.443L4.77676 186.539C-9.06694 153.848 11.8616 116.921 47.0209 112.003L128.986 100.537C141.969 98.7205 153.847 92.2439 162.406 82.3149L216.599 19.4479Z" fill="#153C66"/>
            </svg>
          </div>
        </section>

        <EventsSection title={pageContent["h2-events"] || "Événements et actualités"} />

        {isMobile ? (
          <MobileFooter pageData={footerData} />
        ) : (
            <DesktopFooter pageData={footerData} />
          )}
      </main>
    </>
  );
}
