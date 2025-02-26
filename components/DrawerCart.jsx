"use client";

import styles from '@/styles/DrawerCart.module.css';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/products/ProductGrid';
import Link from 'next/link';
import Box from '@mui/material/Box';
import { Drawer } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

export default function DrawerCart({ trigger }) {
  const [open, setOpen] = useState(false);
  const cartContext = useCart ? useCart() : { cart: [], getCartTotal: () => 0 };
  const { cart, getCartTotal } = cartContext;
  
  const toggleDrawer = (state) => () => {
    setOpen(state);
  };
  
  const formatPrice = (price) => {
    return typeof price === 'number' 
      ? `${price.toFixed(2)} $` 
      : price;
  };
  
  return (
    <>
      <div onClick={toggleDrawer(true)}>
        {trigger.content}
      </div>
      <Drawer 
        open={open} 
        anchor="right" 
        onClose={toggleDrawer(false)}
        slotProps={{
          paper: {
            className: styles.drawer
          }
        }}
      >
        <Box sx={{ width: 400 }} role="presentation">
          <div className={styles.drawerHeader}>
            <h2 className={styles.title}>VOTRE PANIER</h2>
            <IconButton 
              aria-label="close" 
              onClick={toggleDrawer(false)}
              className={styles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <div className={styles.drawerContent}>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Votre panier est vide</p>
            ) : (
                <>
                  <div className={styles.cartItems}>
                    <ProductGrid 
                      products={cart}
                      showDescription={false}
                      showQuantity={true}
                      showRemove={true}
                      showAddToCart={false}
                    />
                  </div>

                  <div className={styles.cartTotal}>
                    <span>Total: </span>
                    <span className={styles.totalAmount}>{formatPrice(getCartTotal())}</span>
                  </div>
                </>
              )}

            {cart.length > 0 && (
              <div className={styles.checkoutContainer}>
                <Link href="/checkout" className={styles.checkoutButton} onClick={toggleDrawer(false)}>
                  Passer la commande
                </Link>
              </div>
            )}
          </div>
        </Box>
      </Drawer>
    </>
  );
}
