/**
 * Get the appropriate tax label for a province
 * @param {string} provinceCode - The two-letter province code
 * @returns {Object} Object containing federal and provincial tax labels
 */
export function getTaxLabels(provinceCode) {
  // Default is GST and PST
  let federalLabel = 'GST';
  let provincialLabel = 'PST';
  
  // Special cases
  switch (provinceCode) {
    case 'QC':
      federalLabel = 'TPS';
      provincialLabel = 'TVQ';
      break;
    case 'ON':
    case 'NB':
    case 'NL':
    case 'NS':
    case 'PE':
      // These provinces use HST (Harmonized Sales Tax)
      federalLabel = 'HST';
      provincialLabel = ''; // No separate provincial tax
      break;
    case 'AB':
    case 'NT':
    case 'YT':
    case 'NU':
      // These provinces only have GST
      federalLabel = 'GST';
      provincialLabel = ''; // No provincial tax
      break;
  }
  
  return { federalLabel, provincialLabel };
}

/**
 * Format tax rates for display
 * @param {number} rate - The tax rate as a decimal
 * @returns {string} Formatted tax rate as a percentage
 */
export function formatTaxRate(rate) {
  return `${(rate * 100).toFixed(3)}%`.replace(/\.?0+%$/, '%');
}
