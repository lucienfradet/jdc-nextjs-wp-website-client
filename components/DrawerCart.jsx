"use client";
import styles from '@/styles/DrawerCart.module.css';
import { useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import ProductGrid from '@/components/products/ProductGrid';
import Link from 'next/link';
import Box from '@mui/material/Box';
import { Drawer } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

export default function DrawerCart({ trigger }) {
  const [open, setOpen] = useState(false);
  const cartContext = useCart ? useCart() : { cart: [], getCartSubtotal: () => 0 };
  const { cart, getCartSubtotal } = cartContext;
  const triggerRef = useRef(null);
  
  const toggleDrawer = (state) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setOpen(state);
  };
  
  const handleClose = () => {
    setOpen(false);
    // Return focus to the trigger element when closing
    setTimeout(() => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }, 0);
  };
  
  const formatPrice = (price) => {
    return typeof price === 'number' 
      ? `${price.toFixed(2)} $` 
      : price;
  };
  
  return (
    <>
      <div onClick={toggleDrawer(true)} ref={triggerRef} tabIndex={0}>
        {trigger.content}
      </div>
      <Drawer 
        open={open} 
        anchor="right" 
        onClose={handleClose}
        slotProps={{
          paper: {
            className: styles.drawer
          }
        }}
        // Add keepMounted={false} to ensure the drawer is fully unmounted when closed
        keepMounted={false}
        disableRestoreFocus
      >
        <Box sx={{ width: 400 }} role="presentation">
          <div className={styles.drawerHeader}>
            <h2 className={styles.title}>VOTRE PANIER</h2>
            <IconButton 
              aria-label="close" 
              onClick={handleClose}
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
                  <span className={styles.totalAmount}>{formatPrice(getCartSubtotal())}</span>
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
