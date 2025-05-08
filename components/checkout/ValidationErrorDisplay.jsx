import styles from '@/styles/checkout/PaymentPage.module.css';

export default function ValidationErrorDisplay({ error }) {
  if (!error || error.type !== 'validation') return null;
  
  const { discrepancies = [] } = error;
  
  // Helper to translate status codes to user-friendly messages
  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'instock': return 'En stock';
      case 'outofstock': return 'Épuisé';
      case 'onbackorder': return 'En commande';
      default: return status;
    }
  };
  
  const getTaxStatusLabel = (status) => {
    switch (status) {
      case 'taxable': return 'Taxable';
      case 'shipping': return 'Frais de livraison uniquement';
      case 'none': return 'Non taxable';
      default: return status;
    }
  };
  
  return (
    <div className={styles.validationError}>
      <h3>Des changements ont été détectés</h3>
      <p>
        Certaines informations de produit ont changé depuis que vous avez ajouté ces articles à votre panier.
        Veuillez retourner à votre panier et actualiser les informations.
      </p>
      
      {discrepancies.length > 0 && (
        <div className={styles.discrepanciesList}>
          <h4>Différences détectées:</h4>
          <ul>
            {discrepancies.map((discrepancy, index) => (
              <li key={index}>
                {/* Price discrepancy */}
                {discrepancy.type === 'price' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Le prix a changé de {discrepancy.clientValue.toFixed(2)}$ à {discrepancy.actualValue.toFixed(2)}$
                  </>
                )}
                
                {/* Tax discrepancy */}
                {discrepancy.type === 'tax_status' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Le statut de taxe a changé de "{getTaxStatusLabel(discrepancy.clientValue)}" à "{getTaxStatusLabel(discrepancy.actualValue)}"
                  </>
                )}
                
                {/* Shipping class discrepancy */}
                {discrepancy.type === 'shipping_class' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    La classe d'expédition a changé de "{discrepancy.clientValue || 'standard'}" à "{discrepancy.actualValue || 'standard'}"
                  </>
                )}
                
                {/* Shipping taxable discrepancy */}
                {discrepancy.type === 'shipping_taxable' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Le statut de taxe d'expédition a changé de "{discrepancy.clientValue ? 'Taxable' : 'Non taxable'}" 
                    à "{discrepancy.actualValue ? 'Taxable' : 'Non taxable'}"
                  </>
                )}
                
                {/* Stock status discrepancy */}
                {discrepancy.type === 'stock_status' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Le statut de stock a changé de "{getStockStatusLabel(discrepancy.clientValue)}" 
                    à "{getStockStatusLabel(discrepancy.actualValue)}"
                  </>
                )}
                
                {/* Out of stock discrepancy */}
                {discrepancy.type === 'out_of_stock' && (
                  <>
                    <strong>{discrepancy.productName}</strong> est maintenant épuisé
                  </>
                )}
                
                {/* Insufficient stock discrepancy */}
                {discrepancy.type === 'insufficient_stock' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Quantité insuffisante. Vous avez demandé {discrepancy.clientValue} unités, 
                    mais seulement {discrepancy.actualValue} sont disponibles
                  </>
                )}
                
                {/* Product type discrepancy */}
                {discrepancy.type === 'product_type' && (
                  <>
                    <strong>{discrepancy.productName}</strong>: 
                    Le type de produit a changé de "{discrepancy.clientValue}" à "{discrepancy.actualValue}"
                  </>
                )}
                
                {/* Total discrepancy */}
                {discrepancy.type === 'total' && (
                  <>
                    <strong>Total</strong>: 
                    Le montant a changé de {discrepancy.clientValue.toFixed(2)}$ à {discrepancy.actualValue.toFixed(2)}$
                  </>
                )}
                
                {/* Shipping discrepancy */}
                {discrepancy.type === 'shipping' && (
                  <>
                    <strong>Frais de livraison</strong>: 
                    Le montant a changé de {discrepancy.clientValue.toFixed(2)}$ à {discrepancy.actualValue.toFixed(2)}$
                  </>
                )}
                
                {/* Tax discrepancy */}
                {discrepancy.type === 'tax' && (
                  <>
                    <strong>Taxes</strong>: 
                    Le montant a changé de {discrepancy.clientValue.toFixed(2)}$ à {discrepancy.actualValue.toFixed(2)}$
                  </>
                )}
                
                {/* For any other types */}
                {!['price', 'tax_status', 'shipping_class', 'shipping_taxable', 'stock_status', 
                   'out_of_stock', 'insufficient_stock', 'product_type', 'total', 'shipping', 'tax']
                  .includes(discrepancy.type) && (
                  <>
                    <strong>{discrepancy.productName || 'Produit'}</strong>: 
                    {discrepancy.message || `Valeur incorrecte pour ${discrepancy.type}`}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={styles.refreshInstructions}>
        <button className={styles.refreshButton} onClick={() => window.location.href = '/checkout'}>
          Retourner au panier
        </button>
      </div>
    </div>
  );
}
