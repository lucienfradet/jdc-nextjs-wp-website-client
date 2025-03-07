import { fetchTaxRates } from '@/lib/wooCommerce';
import { getTaxLabels } from '@/lib/taxUtils';

export async function POST(request) {
  try {
    // Get request body (cart items and province)
    const { items, province } = await request.json();
    
    const taxRatesData = await fetchTaxRates();
    
    // Format taxRatesData
    const federalRate = taxRatesData.find(tax => 
      tax.country === 'CA' && (!tax.state || tax.state === '')
    ).rate / 100;

    // Check if province is found in tax rates data
    if (!federalRate) {
      throw new Error(`Federal tax rate not found`);
    }

    const provincialRateRaw = taxRatesData.filter(tax => 
      tax.country === 'CA' && tax.state.toLowerCase() === province.toLowerCase()
    )

    console.log(province);
    console.log(provincialRateRaw)

    // Check if province is found in tax rates data
    if (provincialRateRaw.length === 0) {
      throw new Error(`Tax rates for province ${province} not found`);
    }

    const provincialRate = provincialRateRaw[0].rate / 100;
    
    // Get tax labels based on province
    const { federalLabel, provincialLabel } = getTaxLabels(province);
    
    // Calculate taxes for each item
    const result = {
      items: [],
      taxSummary: {
        [federalLabel]: { rate: federalRate, amount: 0 }
      }
    };
    
    // Add provincial tax entry if applicable
    if (provincialLabel && provincialRate > 0) {
      result.taxSummary[provincialLabel] = { rate: provincialRate, amount: 0 };
    } else if (federalLabel === 'HST') {
      // For HST provinces, the rate is combined federal + provincial
      result.taxSummary[federalLabel].rate = federalRate + provincialRate;
    }
    
    // Calculate taxes for each item
    items.forEach(item => {
      const price = parseFloat(item.price || 0);
      const quantity = item.quantity || 1;
      const subtotal = price * quantity;
      
      const itemTax = {
        id: item.id,
        taxable: item.tax_status === 'taxable',
        taxes: {}
      };
      
      if (itemTax.taxable) {
        // Calculate federal tax
        const federalTaxAmount = subtotal * federalRate;
        itemTax.taxes[federalLabel] = federalTaxAmount;
        result.taxSummary[federalLabel].amount += federalTaxAmount;
        
        // Calculate provincial tax if applicable
        if (provincialLabel && provincialRate > 0) {
          const provincialTaxAmount = subtotal * provincialRate;
          itemTax.taxes[provincialLabel] = provincialTaxAmount;
          result.taxSummary[provincialLabel].amount += provincialTaxAmount;
        }
      }
      
      result.items.push(itemTax);
    });
    
    // Calculate total tax
    result.totalTax = Object.values(result.taxSummary).reduce(
      (sum, tax) => sum + tax.amount, 
      0
    );
    
    return Response.json(result);
  } catch (error) {
    console.error('Error calculating taxes:', error);
    return Response.json({ 
      error: error.message || 'Failed to calculate taxes' 
    }, { status: 500 });
  }
}
