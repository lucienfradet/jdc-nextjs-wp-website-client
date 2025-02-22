import ProductCard from "@/components/products/ProductCard";
import styles from "@/styles/products/ProductGrid.module.css";

export default function ProductsGrid({ products,showDescription, showQuantity, showRemove, showAddToCart }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product}
          className={styles.card}
          showDescription={showDescription}
          showQuantity={showQuantity}
          showRemove={showRemove}
          showAddToCart={showAddToCart}
        />
      ))}
    </div>
  );
}
