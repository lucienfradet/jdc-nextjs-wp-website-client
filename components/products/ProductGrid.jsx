import ProductCard from "@/components/products/ProductCard";
import styles from "@/styles/products/ProductGrid.module.css";

export default function ProductsGrid({ products,showDescription, showQuantity, showRemove, showAddToCart }) {
  // Check if products is an array
  if (!Array.isArray(products)) {
    // Check if it's an error object
    if (products && products.status >= 400) {
      return <div className={styles.error}>Une erreur s&apos;est produite lors de la récupération des produits</div>;
    }
    // If it's neither an array nor an error object
    return <div className={styles.noProducts}>Aucun éléments trouvé</div>;
  }

  // Check if the array is empty
  if (products.length === 0) {
    return <div className={styles.noProducts}>Aucun éléments trouvé</div>;
  }

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
