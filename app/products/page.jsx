export default async function ProductsPage({ searchParams }) {
  // Await searchParams before using it
  const { point } = await searchParams;
  const selectedPointId = point;

  // Fetch products and points in parallel
  const [productsRes, pointsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`, { cache: "no-store" }),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/point_de_chute`, { cache: "no-store" })
  ]);

  if (!productsRes.ok || !pointsRes.ok) {
    return <p>Erreur de chargement des produits et/ou points de chutes.</p>;
  }

  const products = await productsRes.json();
  const points = await pointsRes.json();
  const selectedPoint = points.find(p => p.id.toString() === selectedPointId);

  return (
    <div>
      <h1>Our Products</h1>

      {/* Points de chute selection form */}
      <form className="mb-8">
        <label htmlFor="point-select" className="mr-2">
          Choisir un point de chute:
        </label>
        <select 
          id="point-select"
          name="point"
          defaultValue={selectedPointId || ""}
          className="p-2 border rounded"
        >
          <option value="">-- Sélectionner --</option>
          {points.map(point => (
            <option key={point.id} value={point.id}>
              {point.location_name}
            </option>
          ))}
        </select>
        <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
          Valider
        </button>
      </form>

      {/* Selected point details */}
      {selectedPoint && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-bold mb-2">{selectedPoint.location_name}</h2>
          <div className="space-y-1">
            <p>{selectedPoint.adresse.adresse}</p>
            <p>{selectedPoint.adresse.code_postale} {selectedPoint.adresse.city}</p>
            <p>{selectedPoint.adresse.province}, {selectedPoint.adresse.pays}</p>
          </div>
          {selectedPoint.description_instructions && (
            <div className="mt-4 prose" 
              dangerouslySetInnerHTML={{ __html: selectedPoint.description_instructions }} 
            />
          )}
        </div>
      )}

      {/* Products list */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <li key={product.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-2">{product.name}</h2>
            {product.images?.[0]?.src && (
              <img 
                src={product.images[0].src} 
                width={300} 
                height={200} 
                alt={product.name}
                className="mb-4 rounded"
              />
            )}
            <p className="text-lg font-semibold">
              {product.price} {product.currency}
            </p>
            <div 
              className="prose"
              dangerouslySetInnerHTML={{ __html: product.description }} 
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
