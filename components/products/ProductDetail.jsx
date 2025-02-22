'use client';

import { useEffect, useState } from "react";
import WPImage from "@/components/WPImage";
import styles from '@/styles/products/ProductDetail.module.css';
import CustomHead from '@/components/CustomHead';
import DesktopHeader from "@/components/desktop/Header";
import MobileHeader from "@/components/mobile/Header";
import DesktopFooter from "@/components/desktop/Footer";
import MobileFooter from "@/components/mobile/Footer";

export default function ProductDetail({ product, headerData, footerData, siteIconUrl }) {
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

  const [selectedQuantity, setSelectedQuantity] = useState(1);
  // const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      ...product,
      quantity: selectedQuantity
    });
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

      <main className={styles.Body}>
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
                <h2>Détailes du produit</h2>
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </div>
            )}

            <div className={styles.quantitySelector}>
              <label>Quantité:</label>
              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value)))}
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
