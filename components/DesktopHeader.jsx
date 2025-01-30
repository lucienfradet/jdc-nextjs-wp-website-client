import { useEffect, useState } from 'react';
import  styles from '../styles/DesktopHeader.module.css';
import Link from 'next/link';

export default function Header({ pageData }) {
  const pageContent = pageData.acfFields;

  //debugging
  // This will only log ounce when pageData changes
  // continious logging when react reloads components on state change
  // (using an empty dependenciy "[]" would have mean it only runs on mount or page reload)
  useEffect(() => {
    // console.log("Header content:", pageContent);
  }, [pageData]); // Only re-log if `pageData` changes

  // scroll hide trigger behaviour
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsHidden(currentScrollY > lastScrollY && currentScrollY > 50); // Hide header on scroll down
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`${styles.header} ${isHidden ? styles.hidden : ''}`}>
      {/* Logo */}
      <Link href="/" passHref className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img src={pageContent["img-logo"].src} alt={pageContent["img-logo"].alt} className={styles.logo} />
          <img src={pageContent["img-logo-red"].src} alt={pageContent["img-logo-red"].alt} className={styles.logoRed} />
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className={styles.nav}>
        <a href="#a-propos">{pageContent["a-propos"]}</a>
        <a href="#abonnement">{pageContent["abonnement"]}</a>
        <a href="#agrotourisme" className={styles.disabled}>{pageContent["agrotourisme"]}</a>
        <a href="#evenements">{pageContent["evenements"]}</a>
        <a href="#contact">{pageContent["contact"]}</a>
      </nav>

      {/* Cart Icon */}
      <div className={styles.cart}>
        <img src={pageContent["img-cart"].src} alt={pageContent["img-cart"].alt} />
      </div>
    </header>
  );
}
