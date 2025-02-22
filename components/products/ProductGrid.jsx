import ProductCard from "@/components/products/ProductCard";

export default function ProductsGrid({ products, columns = 3 }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
      {products.map((product) => (
        <ProductCard 
          key={product.id}
          product={product}
          className="border rounded-lg shadow-md hover:shadow-lg transition-shadow"
        />
      ))}
    </div>
  );
}
