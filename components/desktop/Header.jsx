"use client";

import { useEffect, useState } from 'react';
import styles from '@/styles/desktop/Header.module.css';
import WPImage from '@/components/WPImage';
import Link from 'next/link';
import DrawerCart from "@/components/DrawerCart";
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function Header({ pageData }) {
  const pageContent = pageData.acfFields;
  const { cart } = useCart();
  const pathname = usePathname(); // Get current path
  
  // Calculate total items in cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  //debugging
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
        <Link 
          href="/a-propos" 
          className={pathname === '/a-propos' ? styles.active : ''}
        >
          {pageContent["a-propos"]}
        </Link>
        <Link 
          href="/abonnement" 
          className={pathname === '/abonnement' ? styles.active : ''}
        >
          {pageContent["abonnement"]}
        </Link>
        <Link 
          href="/agrotourisme" 
          className={pathname === '/agrotourisme' ? styles.active : ''}
        >
          {pageContent["agrotourisme"]}
        </Link>
        <Link 
          href="/evenements" 
          className={pathname === '/evenements' ? styles.active : ''}
        >
          {pageContent["evenements"]}
        </Link>
        <Link 
          href="/contact" 
          className={pathname === '/contact' ? styles.active : ''}
        >
          {pageContent["contact"]}
        </Link>
      </nav>

      {/* Cart Icon with number indicator */}
      <DrawerCart
        trigger={{
          content: (
            <div className={styles.cartContainer}>
              <div className={styles.cart}>
                <WPImage image={pageContent["img-cart"]} forceFullSize={true} />
              </div>
              {totalItems > 0 && (
                <div className={styles.cartCounter}>
                  {totalItems}
                </div>
              )}
            </div>
          ),
        }}
      />
      
    </header>
  );
}
