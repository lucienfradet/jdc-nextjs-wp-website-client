import  styles from '../styles/MobileHeader.module.css';
import { useState, useEffect } from "react";
import BurgerMenu from "./BurgerMenu";
import Link from 'next/link';

export default function Header({ pageData }) {
  const pageContent = pageData.acfFields;

  const [burgerState, setBurgerState] = useState(1);
  // scroll hide trigger behaviour
  const [isHidden, setIsHidden] = useState(false);

  const handleBurgerClick = () => {
    setBurgerState((prev) => {
      const newState = (prev + 1) % 2;
      if (newState === 0) {
        setIsHidden(false); // Ensure header is visible when menu opens
      }
      return newState;
    });
  };


  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (burgerState === 1) {
        const currentScrollY = window.scrollY;
        setIsHidden(currentScrollY > lastScrollY && currentScrollY > 50); // Hide header on scroll down
        lastScrollY = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [burgerState]); // adding burgerState as a dependency (make sure burgerState returns the new state)

  return (
    <header className={`${styles.header} ${isHidden ? styles.hidden : ''}`}>
      {/* Logo */}
      <Link href="/" passHref className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img src={pageContent["img-logo"].src} alt={pageContent["img-logo"].alt} className={styles.logo} />
        </div>
      </Link>

      {/* Cart Icon */}
      <div className={styles.cart}>
        <img src={pageContent["img-cart"].src} alt={pageContent["img-cart"].alt} />
      </div>

      <div className={styles.burgerMenu}>
        <BurgerMenu burgerState={burgerState} onBurgerClick={handleBurgerClick} />
      </div>

      {/* Navigation Links */}
      <nav className={`${styles.nav} ${burgerState === 0 ? styles.active : ''}`}>
        <a href="/a-propos">{pageContent["a-propos"]}</a>
        <a href="/abonnement">{pageContent["abonnement"]}</a>
        <a href="/agrotourisme" className={styles.disabled}>{pageContent["agrotourisme"]}</a>
        <a href="/evenements">{pageContent["evenements"]}</a>
        <a href="/contact">{pageContent["contact"]}</a>
      </nav>
    </header>
  );
}
