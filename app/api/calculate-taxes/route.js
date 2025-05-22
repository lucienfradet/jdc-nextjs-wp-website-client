import { fetchTaxRates } from '@/lib/wooCommerce';
import { getTaxLabels } from '@/lib/taxUtils';
import { withRateLimit } from '@/lib/rateLimiter';

async function handlePostRequest(request) {
  try {
    // Get request body (cart items and province)
    const { items, province, shipping } = await request.json();
    
    const taxRatesData = await fetchTaxRates();
    
    // Format taxRatesData - get both customer province and Quebec rates
    const federalRate = taxRatesData.find(tax => 
      tax.country === 'CA' && (!tax.state || tax.state === '')
    ).rate / 100;

    // Check if federal rate is found
    if (!federalRate) {
      throw new Error(`Federal tax rate not found`);
    }

    // Get customer province tax rates
    const customerProvincialRateRaw = taxRatesData.filter(tax => 
      tax.country === 'CA' && tax.state.toLowerCase() === province.toLowerCase()
    );

    // Check if customer province is found in tax rates data
    if (customerProvincialRateRaw.length === 0) {
      throw new Error(`Tax rates for province ${province} not found`);
    }

    const customerProvincialRate = customerProvincialRateRaw[0].rate / 100;

    // Get Quebec tax rates for booking items
    const quebecProvincialRateRaw = taxRatesData.filter(tax => 
      tax.country === 'CA' && tax.state.toLowerCase() === 'qc'
    );

    if (quebecProvincialRateRaw.length === 0) {
      throw new Error(`Quebec tax rates not found for booking items`);
    }

    const quebecProvincialRate = quebecProvincialRateRaw[0].rate / 100;

    // Get tax labels for both provinces
    const { federalLabel: customerFederalLabel, provincialLabel: customerProvincialLabel } = getTaxLabels(province);
    const { federalLabel: quebecFederalLabel, provincialLabel: quebecProvincialLabel } = getTaxLabels('QC');
    
    // Initialize result with customer province labels
    const result = {
      items: [],
      taxSummary: {
        [customerFederalLabel]: { rate: federalRate, amount: 0 }
      }
    };
    
    // Add customer provincial tax entry if applicable
    if (customerProvincialLabel && customerProvincialRate > 0) {
      result.taxSummary[customerProvincialLabel] = { rate: customerProvincialRate, amount: 0 };
    } else if (customerFederalLabel === 'HST') {
      // For HST provinces, the rate is combined federal + provincial
      result.taxSummary[customerFederalLabel].rate = federalRate + customerProvincialRate;
    }

    // Add Quebec tax labels to summary if we have booking items and customer is not in Quebec
    const hasBookingItems = items.some(item => item.type === 'mwb_booking' || item.isBooking);
    const customerIsNotInQuebec = province.toLowerCase() !== 'qc';
    
    if (hasBookingItems && customerIsNotInQuebec) {
      // Add Quebec TPS if not already present
      if (!result.taxSummary[quebecFederalLabel]) {
        result.taxSummary[quebecFederalLabel] = { rate: federalRate, amount: 0 };
      }
      
      // Add Quebec TVQ
      if (quebecProvincialLabel && quebecProvincialRate > 0) {
        result.taxSummary[quebecProvincialLabel] = { rate: quebecProvincialRate, amount: 0 };
      }
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
        // Determine if this is a booking item
        const isBookingItem = item.type === 'mwb_booking' || item.isBooking;
        
        if (isBookingItem) {
          // Use Quebec taxes for booking items
          const federalTaxAmount = subtotal * federalRate;
          itemTax.taxes[quebecFederalLabel] = federalTaxAmount;
          result.taxSummary[quebecFederalLabel].amount += federalTaxAmount;
          
          // Calculate Quebec provincial tax
          if (quebecProvincialLabel && quebecProvincialRate > 0) {
            const provincialTaxAmount = subtotal * quebecProvincialRate;
            itemTax.taxes[quebecProvincialLabel] = provincialTaxAmount;
            result.taxSummary[quebecProvincialLabel].amount += provincialTaxAmount;
          }
        } else {
          // Use customer's province taxes for non-booking items
          const federalTaxAmount = subtotal * federalRate;
          itemTax.taxes[customerFederalLabel] = federalTaxAmount;
          result.taxSummary[customerFederalLabel].amount += federalTaxAmount;
          
          // Calculate customer's provincial tax if applicable
          if (customerProvincialLabel && customerProvincialRate > 0) {
            const provincialTaxAmount = subtotal * customerProvincialRate;
            itemTax.taxes[customerProvincialLabel] = provincialTaxAmount;
            result.taxSummary[customerProvincialLabel].amount += provincialTaxAmount;
          }
        }
      }
      
      result.items.push(itemTax);
    });
    
    // Calculate total tax
    result.totalTax = Object.values(result.taxSummary).reduce(
      (sum, tax) => sum + tax.amount, 
      0
    );

    // Add taxes to shipping if needed
    // For shipping, always use customer's province rates
    result.appliedToShipping = customerProvincialRateRaw[0].shipping;
    if (result.appliedToShipping) {
      result.totalTax += (shipping * federalRate + shipping * customerProvincialRate);
      if (customerProvincialLabel) {
        result.taxSummary[customerProvincialLabel].amount += shipping * customerProvincialRate;
        result.taxSummary[customerFederalLabel].amount += shipping * federalRate;
      } else {
        result.taxSummary[customerFederalLabel].amount += shipping * federalRate;
      }
    }
    
    return Response.json(result);
  } catch (error) {
    console.error('Error calculating taxes:', error);
    return Response.json({ 
      error: error.message || 'Failed to calculate taxes' 
    }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePostRequest, 'products');
