import Image from "next/image";

export default async function ProductsPage() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`, {
        cache: "no-store", // Prevent stale data from being cached
    });

    if (!res.ok) {
        return <p>Error loading products.</p>;
    }

    const products = await res.json();

    return (
        <div>
            <h1>Our Products</h1>
            <ul>
                {products.map((product) => (
                    <li key={product.id}>
                        <h2>{product.name}</h2>
                        {product.images.length > 0 && (
                            <img 
                                src={product.images[0].src} 
                                width={300} 
                                height={200} 
                                alt={product.name} 
                            />
                        )}
                        <p>{product.price} {product.currency}</p>
                        <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
