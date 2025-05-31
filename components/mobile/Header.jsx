"use client";

import styles from '@/styles/mobile/Header.module.css';
import { useState, useEffect } from "react";
import WPImage from '@/components/WPImage';
import BurgerMenu from "@/components/BurgerMenu";
import DrawerCart from "@/components/DrawerCart";
import NavigationLink from '../NavigationLink';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function Header({ pageData }) {
  const pageContent = pageData.acfFields;
  const { cart } = useCart();
  const pathname = usePathname(); // Get current path
  
  // Calculate total items in cart
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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

    setIsHidden(false);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [burgerState]); // adding burgerState as a dependency

  return (
    <header className={`${styles.header} ${isHidden ? styles.hidden : ''}`}>
      {/* Logo */}
      <NavigationLink href="/" passHref className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <WPImage className={styles.logo} image={pageContent["img-logo"]} forceFullSize={true} />
        </div>
      </NavigationLink>

      {/* Cart Icon with number indicator */}
      <div className={styles.cartContainer}>
        <DrawerCart
          trigger={{
            content: (
              <div className={styles.cart}>
                <WPImage image={pageContent["img-cart"]} forceFullSize={true} />
              </div>
            ),
          }}
        />
        {totalItems > 0 && (
          <div className={styles.cartCounter}>
            {totalItems}
          </div>
        )}
      </div>

      <div className={styles.burgerMenu}>
        <BurgerMenu burgerState={burgerState} onBurgerClick={handleBurgerClick} />
      </div>

      {/* Navigation Links */}
      <nav className={`${styles.nav} ${burgerState === 0 ? styles.active : ''}`}>
        <NavigationLink 
          href="/a-propos" 
          className={pathname === '/a-propos' ? styles.active : ''}
        >
          {pageContent["a-propos"]}
        </NavigationLink>
        <NavigationLink 
          href="/abonnement" 
          className={pathname === '/abonnement' ? styles.active : ''}
        >
          {pageContent["abonnement"]}
        </NavigationLink>
        <NavigationLink 
          href="/agrotourisme" 
          className={pathname === '/agrotourisme' ? styles.active : ''}
        >
          {pageContent["agrotourisme"]}
        </NavigationLink>
        <NavigationLink 
          href="/evenements" 
          className={pathname === '/evenements' ? styles.active : ''}
        >
          {pageContent["evenements"]}
        </NavigationLink>
        <NavigationLink 
          href="/contact" 
          className={pathname === '/contact' ? styles.active : ''}
        >
          {pageContent["contact"]}
        </NavigationLink>
      </nav>
    </header>
  );
}
