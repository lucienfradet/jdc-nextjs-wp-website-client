import Image from "next/image";
import styles from "@/styles/products/ProductCard.module.css";

export default function ProductCard({ product, className }) {
  return (
    <article className={styles.card}>
      <div className={styles.imageContainer}>
        {product.images?.[0]?.src && (
          <Image
            src={product.images[0].src}
            alt={product.name}
            fill
            className={styles.image}
          />
        )}
      </div>
      
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
        
        <div className="mt-auto">
          <p className="text-lg font-semibold mb-4">
            {product.price} {product.currency}
          </p>
          
          {product.description && (
            <div 
              className="prose text-sm mb-4 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          )}
        </div>
      </div>
    </article>
  );
}
