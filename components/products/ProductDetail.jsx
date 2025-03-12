'use client';

import { useEffect, useState } from "react";
import WPImage from "@/components/WPImage";
import styles from '@/styles/products/ProductDetail.module.css';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";
import { useCart } from '@/context/CartContext';

export default function ProductDetail({ product, headerData, footerData, siteIconUrl }) {
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

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

  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value);
    if (newQuantity < 1) return;
    
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAddingToCart(true);

    // Reset animation state after a short delay
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };

  return (
    <>
      <CustomHead
        title={`Page de produit: ${product.name}`}
        description={`Page de produits unique.`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.id}`}
        siteIconUrl={siteIconUrl}
      />

      {isMobile ? (
        <MobileHeader pageData={headerData} />
      ) : (
        <DesktopHeader pageData={headerData} />
        )}

      <main className={`${styles.Body} ${isAddingToCart ? styles.addingToCart : ''}`}>
        <div className={styles.container}>
          {product.images?.[0] && (
            <div className={styles.imageWrapper}>
              <WPImage 
                image={product.images[0]} 
                className={styles.image}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          <div className={styles.productInfo}>
            <h1 className={styles.productTitle}>{product.name}</h1>

            <div className={styles.priceContainer}>
              <div dangerouslySetInnerHTML={{ __html: product.price_html }} />
              {product.regular_price && (
                <del className={styles.regularPrice}>
                  {product.regular_price}
                </del>
              )}
            </div>

            {product.description && (
              <div className={styles.description}>
                <h2>Détails du produit</h2>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            <div className={styles.quantitySelector}>
              <label htmlFor={`quantity-${product.id}`}>Quantité:</label>
              <input
                type="number"
                id={`quantity-${product.id}`}
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
              />
            </div>

            <button 
              onClick={handleAddToCart}
              className={styles.addToCartButton}
            >
              Ajouter au panier
            </button>
          </div>
        </div>
      </main>

      {isMobile ? (
        <MobileFooter pageData={footerData} />
      ) : (
          <DesktopFooter pageData={footerData} />
        )}
    </>
  );
}
