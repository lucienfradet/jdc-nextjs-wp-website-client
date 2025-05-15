"use client";

import { useEffect, useState, useRef } from "react";
import WPImage from "@/components/WPImage";
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import { renderContent } from "@/lib/textUtils";
import styles from '@/styles/AProposPage.module.css';
import useIntersectionObserver from '@/lib/useIntersectionObserver'; // Import the hook

export default function AProposPage({ 
  pageData,
  headerData,
  footerData
}) {
  const pageContent = pageData.acfFields;

  const [isMobile, setIsMobile] = useState(false);
  const [activeCircle, setActiveCircle] = useState(null);
  const [clickedImages, setClickedImages] = useState({ img1: false, img2: false, img3: false });
  const [circlesInView, setCirclesInView] = useState({ circle1: false, circle2: false });


  // Set up the intersection observer
  const [addScrollRef, observerEntries] = useIntersectionObserver({
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  });

  // Handle visibility based on intersection
  useEffect(() => {
    observerEntries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, [observerEntries]);
  
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);

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

  // Set up Intersection Observer for circles
  useEffect(() => {
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.5, // 50% of the element is visible
    };

    const circleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === circle1Ref.current) {
          setCirclesInView(prev => ({ ...prev, circle1: entry.isIntersecting }));
        } else if (entry.target === circle2Ref.current) {
          setCirclesInView(prev => ({ ...prev, circle2: entry.isIntersecting }));
        }
      });
    }, options);

    if (circle1Ref.current) {
      circleObserver.observe(circle1Ref.current);
    }
    if (circle2Ref.current) {
      circleObserver.observe(circle2Ref.current);
    }

    return () => {
      if (circle1Ref.current) {
        circleObserver.unobserve(circle1Ref.current);
      }
      if (circle2Ref.current) {
        circleObserver.unobserve(circle2Ref.current);
      }
    };
  }, []);

  // Helper to handle circle flip
  const handleCircleClick = (circleNum) => {
    setCirclesInView({circle1: false, circle2: false});

    if (activeCircle === circleNum) {
      setActiveCircle(null);
    } else {
      setActiveCircle(circleNum);
    }
  };

  // Helper to handle person image click
  const handlePersonImageClick = (imageNum) => {
    setClickedImages(prev => {
      const newState = { ...prev, [`img${imageNum}`]: true };

      // Reset the state after animation duration
      setTimeout(() => {
        setClickedImages(prev => ({ ...prev, [`img${imageNum}`]: false }));
      }, 2000); // Animation duration + a bit more

      return newState;
    });
  };

  // Helper to format Section 3 text (newspaper style if 2 paragraphs)
  const formatSection3Text = () => {
    if (!pageContent["section-3"]["histoire-texte"]) return null;

    const htmlContent = pageContent["section-3"]["histoire-texte"];
    // Split by double newlines which typically separate paragraphs
    const paragraphs = htmlContent.split(/\r\n\r\n/).filter(part => part.trim().startsWith('<p'));

    if (paragraphs && paragraphs.length === 2) {
      // If exactly 2 paragraphs, format them side by side
      return (
        <div className={styles.newspaperLayout}>
          <div className={styles.column} dangerouslySetInnerHTML={{ __html: paragraphs[0] }}></div>
          <div className={styles.column} dangerouslySetInnerHTML={{ __html: paragraphs[1] }}></div>
        </div>
      );
    } else {
      // Otherwise, render normally
      return renderContent(htmlContent);
    }
  };

  return (
    <>
      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
      )}

      <main className={styles.aProposBody}>
          <div className={styles.svgBackground}>
            <svg xmlns="http://www.w3.org/2000/svg" width="1766" height="638" viewBox="0 0 1766 638" fill="none">
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
          </div>

        {/* Section 1 */}
        <section 
          className={`${styles.section1} reveal-on-scroll`}
          ref={addScrollRef}
        >
          <div className={styles.backgroundContainer}>
            <WPImage 
              image={pageContent["section-1"]["background-img"]} 
              className={styles.backgroundImage}
              forceFullSize={true}
            />
          </div>
          <div className={styles.contentBox}>
            <h1>{pageContent["section-1"]["title"]}</h1>
            {renderContent(pageContent["section-1"]["texte_explicatif"])}
            <div className={styles.logoWrapper}>
              <WPImage 
                image={pageContent["section-1"]["logo"]} 
                className={styles.logo}
              />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section 
          className={`${styles.section2}`}
        >
          <div className={styles.circlesContainer}>
            <div 
              ref={circle1Ref}
              className={`${styles.circle} ${styles.circle1} 
                ${activeCircle === 1 ? styles.flipped : ''} 
                ${circlesInView.circle1 ? styles.pulseEffect : ''}`}
              onClick={() => handleCircleClick(1)}
            >
              <div className={styles.circleFront}>
                <WPImage 
                  image={pageContent["section-2"]["rond-1"]} 
                  className={styles.circleImage}
                />
              </div>
              <div className={styles.circleBack}>
                <p>{pageContent["section-2"]["rond-1-texte"]}</p>
              </div>
              {circlesInView.circle1 && <div className={styles.clickIndicator}></div>}
            </div>
            <div 
              ref={circle2Ref}
              className={`${styles.circle} ${styles.circle2} 
                ${activeCircle === 2 ? styles.flipped : ''} 
                ${circlesInView.circle2 ? styles.pulseEffect : ''}`}
              onClick={() => handleCircleClick(2)}
            >
              <div className={styles.circleFront}>
                <WPImage 
                  image={pageContent["section-2"]["rond-2"]} 
                  className={styles.circleImage}
                />
              </div>
              <div className={styles.circleBack}>
                <p>{pageContent["section-2"]["rond-2-texte"]}</p>
              </div>
              {circlesInView.circle2 && <div className={styles.clickIndicator}></div>}
            </div>
          </div>
          
          <div className={styles.backgroundImageContainer}>
            <div className={styles.catchPhraseBox}>
              <p>{pageContent["section-2"]["catch-phrase"]}</p>
            </div>

            <WPImage 
              image={pageContent["section-2"]["background-img"]} 
              className={styles.backgroundImage2}
              forceFullSize={true}
            />
          </div>
        </section>

        {/* Section 3 */}
        <section 
          className={`${styles.section3} reveal-on-scroll`}
          ref={addScrollRef}
        >
          <div className={styles.centerImageContainer}>
            <WPImage 
              image={pageContent["section-3"]["center-img"]} 
              className={styles.centerImage}
            />
          </div>
          
          <div className={styles.historyTextContainer}>
            {formatSection3Text()}
          </div>
          
          <div className={styles.imageRow}>
            <div 
              className={`${styles.personImageContainer} ${clickedImages.img1 ? styles.clicked : ''}`} 
              onClick={() => handlePersonImageClick(1)}
            >
              <WPImage 
                image={pageContent["section-3"]["jw-img"]} 
                className={styles.personImage}
              />
              <div className={styles.personImageAltText}>
                {pageContent["section-3"]["jw-img"]?.alt || "Image description"}
              </div>
            </div>

            <div 
              className={`${styles.personImageContainer} ${clickedImages.img2 ? styles.clicked : ''}`} 
              onClick={() => handlePersonImageClick(2)}
            >
              <WPImage 
                image={pageContent["section-3"]["mike-img"]} 
                className={styles.personImage}
              />
              <div className={styles.personImageAltText}>
                {pageContent["section-3"]["mike-img"]?.alt || "Image description"}
              </div>
            </div>

            <div 
              className={`${styles.personImageContainer} ${clickedImages.img3 ? styles.clicked : ''}`} 
              onClick={() => handlePersonImageClick(3)}
            >
              <WPImage 
                image={pageContent["section-3"]["gaby-img"]} 
                className={styles.personImage}
              />
              <div className={styles.personImageAltText}>
                {pageContent["section-3"]["gaby-img"]?.alt || "Image description"}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section 
          className={`${styles.section4} reveal-on-scroll`}
          ref={addScrollRef}
        >
          <div className={styles.contentContainer}>
            <div className={styles.textSide}>
              <h2>{pageContent["section-4"]["title"]}</h2>
              {renderContent(pageContent["section-4"]["texte"])}
            </div>
            
            <div className={styles.videoSide}>
              <iframe
                src={pageContent["section-4"]["video-link"].replace('watch?v=', 'embed/')}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoEmbed}
              ></iframe>
              
              <div className={styles.videoBackgroundSVGs}>
                <svg className={styles.videoSvg1} width="317" height="317" viewBox="0 0 317 317" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M184.204 5.56159C195.491 -3.66502 212.515 1.13486 217.321 14.8987L229.795 50.6279C232.486 58.3352 239.4 63.7847 247.522 64.6007L285.177 68.3835C299.682 69.8407 308.326 85.2726 301.992 98.4031L285.548 132.488C282.001 139.841 283.036 148.583 288.203 154.903L312.154 184.204C321.38 195.491 316.58 212.516 302.816 217.321L267.087 229.795C259.38 232.486 253.931 239.4 253.115 247.522L249.332 285.177C247.875 299.682 232.443 308.326 219.312 301.992L185.227 285.548C177.875 282.001 169.133 283.036 162.812 288.203L133.511 312.154C122.224 321.38 105.2 316.58 100.394 302.817L87.9202 267.087C85.2293 259.38 78.3156 253.931 70.1929 253.115L32.5384 249.332C18.0328 247.875 9.38886 232.443 15.7235 219.312L32.1673 185.227C35.7145 177.875 34.6791 169.133 29.5125 162.812L5.5615 133.511C-3.66511 122.224 1.13477 105.2 14.8987 100.394L50.6278 87.9203C58.3352 85.2294 63.7846 78.3157 64.6006 70.193L68.3834 32.5385C69.8406 18.0328 85.2726 9.38895 98.403 15.7236L132.488 32.1674C139.841 35.7146 148.583 34.6792 154.903 29.5126L184.204 5.56159Z" fill="#A22D22"/>
                </svg>
                <svg className={styles.videoSvg2} width="337" height="340" viewBox="0 0 337 340" fill="none"  xmlns="http://www.w3.org/2000/svg">
                  <path d="M82.6287 21.2835C90.943 6.0793 108.102 -2.042 125.131 1.16707L283.465 31.004C300.494 34.2131 313.521 48.0226 315.731 65.2101L336.282 225.015C338.492 242.202 329.384 258.858 313.721 266.272L168.088 335.199C152.425 342.613 133.77 339.097 121.879 326.491L11.322 209.286C-0.568718 196.681 -2.99016 177.852 5.3242 162.648L82.6287 21.2835Z" fill="#24311B"/>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 - Podcast */}
        <section 
          className={`${styles.section5} reveal-on-scroll`}
          ref={addScrollRef}
        >
          <div className={styles.podcastContainer}>
            <div className={styles.podcastContent}>
              <h2>{pageContent["section-5"]["title"]}</h2>
              {renderContent(pageContent["section-5"]["texte"])}
              
              <a 
                href={pageContent["section-5"]["podcast-url"]} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.podcastButton}
              >
                Écouter le podcast
              </a>
            </div>
            
            <div className={styles.podcastImageWrapper}>
              <a 
                href={pageContent["section-5"]["podcast-url"]} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.podcastImageLink}
              >
                <WPImage 
                  image={pageContent["section-5"]["podcast-img"]} 
                  className={styles.podcastImage}
                />
              </a>
            </div>
            
            <div className={styles.decorElements}>
              <div className={styles.decorCircle1}></div>
              <div className={styles.decorCircle2}></div>
              <div className={styles.decorCircle3}></div>
            </div>
          </div>
        </section>
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
        <DesktopFooter pageData={footerData} />
      )}
    </>
  );
}
