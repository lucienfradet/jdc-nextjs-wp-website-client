"use client";

import { useEffect, useState } from 'react';
import  styles from '@/styles/desktop/Header.module.css';
import WPImage from '@/components/WPImage';
import Link from 'next/link';
import DrawerCart from "@/components/DrawerCart";

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
          <WPImage className={styles.logo} image={pageContent["img-logo"]} forceFullSize={true} />
          <WPImage className={styles.logoRed} image={pageContent["img-logo-red"]} forceFullSize={true} />
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className={styles.nav}>
        <a href="/a-propos">{pageContent["a-propos"]}</a>
        <a href="/abonnement">{pageContent["abonnement"]}</a>
        <a href="/agrotourisme" className={styles.disabled}>{pageContent["agrotourisme"]}</a>
        <a href="/evenements">{pageContent["evenements"]}</a>
        <a href="/contact">{pageContent["contact"]}</a>
      </nav>

      {/* Cart Icon */}
      <DrawerCart
        trigger={{
          content: (
            <div className={styles.cart}>
              <WPImage image={pageContent["img-cart"]} forceFullSize={true} />
            </div>
          ),
        }}
      />
      
    </header>
  );
}
