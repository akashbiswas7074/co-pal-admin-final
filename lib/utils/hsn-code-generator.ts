/**
 * HSN Code Generator Utility
 * Generates HSN codes based on product categories
 */

export interface HSNCodeMapping {
  [key: string]: string;
}

// HSN Code mappings for common product categories
export const HSN_CODE_MAPPINGS: HSNCodeMapping = {
  // Textiles and Apparel
  'clothing': '6109',
  'apparel': '6109',
  'shirts': '6205',
  'trousers': '6203',
  'dresses': '6204',
  'footwear': '6403',
  'shoes': '6403',
  'bags': '4202',
  'leather': '4202',
  
  // Electronics
  'electronics': '8517',
  'mobile': '8517',
  'phone': '8517',
  'computer': '8471',
  'laptop': '8471',
  'tablet': '8471',
  'headphones': '8518',
  'speakers': '8518',
  'camera': '9006',
  'television': '8528',
  'tv': '8528',
  
  // Home and Garden
  'furniture': '9403',
  'home': '6302',
  'kitchen': '7323',
  'utensils': '7323',
  'appliances': '8516',
  'tools': '8205',
  
  // Books and Media
  'books': '4901',
  'stationery': '4901',
  'paper': '4901',
  'music': '8523',
  'movies': '8523',
  
  // Sports and Recreation
  'sports': '9506',
  'fitness': '9506',
  'toys': '9503',
  'games': '9504',
  
  // Beauty and Personal Care
  'cosmetics': '3304',
  'beauty': '3304',
  'skincare': '3304',
  'perfume': '3303',
  'soap': '3401',
  'shampoo': '3305',
  
  // Food and Beverages
  'food': '2106',
  'snacks': '1905',
  'beverages': '2202',
  'tea': '0902',
  'coffee': '0901',
  'spices': '0910',
  
  // Jewelry and Accessories
  'jewelry': '7113',
  'watches': '9102',
  'accessories': '7117',
  
  // Automotive
  'automotive': '8708',
  'car': '8708',
  'bike': '8714',
  'motorcycle': '8711',
  
  // Default fallback
  'default': '9999',
  'others': '9999',
  'general': '9999'
};

/**
 * Generate HSN code based on product category
 * @param productCategory - The product category string
 * @returns HSN code string
 */
export function generateHSNCode(productCategory?: string): string {
  if (!productCategory) {
    return HSN_CODE_MAPPINGS.default;
  }
  
  // Normalize the category to lowercase and remove special characters
  const normalizedCategory = productCategory.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  // Direct match
  if (HSN_CODE_MAPPINGS[normalizedCategory]) {
    return HSN_CODE_MAPPINGS[normalizedCategory];
  }
  
  // Fuzzy match - check if any key is contained in the category
  for (const [key, hsnCode] of Object.entries(HSN_CODE_MAPPINGS)) {
    if (key !== 'default' && key !== 'others' && key !== 'general') {
      if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
        return hsnCode;
      }
    }
  }
  
  // Return default if no match found
  return HSN_CODE_MAPPINGS.default;
}

/**
 * Get all available HSN codes with their categories
 * @returns Array of HSN code mappings
 */
export function getAvailableHSNCodes(): Array<{ category: string; hsnCode: string }> {
  return Object.entries(HSN_CODE_MAPPINGS).map(([category, hsnCode]) => ({
    category,
    hsnCode
  }));
}

/**
 * Validate HSN code format
 * @param hsnCode - HSN code to validate
 * @returns boolean indicating if HSN code is valid
 */
export function validateHSNCode(hsnCode: string): boolean {
  // HSN codes are typically 4-8 digit numbers
  const hsnRegex = /^\d{4,8}$/;
  return hsnRegex.test(hsnCode);
}

/**
 * Auto-generate HSN code from product description
 * @param productDescription - Product description text
 * @returns HSN code based on keywords found in description
 */
export function generateHSNFromDescription(productDescription?: string): string {
  if (!productDescription) {
    return HSN_CODE_MAPPINGS.default;
  }
  
  const description = productDescription.toLowerCase().trim();
  
  // Look for keywords in the description
  for (const [category, hsnCode] of Object.entries(HSN_CODE_MAPPINGS)) {
    if (category !== 'default' && category !== 'others' && category !== 'general') {
      if (description.includes(category)) {
        return hsnCode;
      }
    }
  }
  
  return HSN_CODE_MAPPINGS.default;
}
