// Shipping calculation utilities

export function getStateFromPincode(pincode: string): string {
  if (!pincode || pincode.length < 2) return "Default";
  const prefix2 = pincode.substring(0, 2);
  const prefix3 = pincode.substring(0, 3);
  
  if (prefix2 === "11") return "Delhi";
  if (prefix2 === "12" || prefix2 === "13") return "Haryana";
  if (prefix2 === "14" || prefix2 === "15") return "Punjab";
  if (prefix2 === "16") return "Chandigarh";
  if (prefix2 === "17") return "Himachal Pradesh";
  if (prefix2 === "18" || prefix2 === "19") return "Jammu and Kashmir";
  if (["20", "21", "22", "23", "24", "25", "26", "27", "28"].includes(prefix2)) {
    if (prefix3.startsWith("246") || prefix3.startsWith("247") || prefix3.startsWith("248") || prefix3.startsWith("249") || prefix3.startsWith("262") || prefix3.startsWith("263")) {
      return "Uttarakhand";
    }
    return "Uttar Pradesh";
  }
  if (["30", "31", "32", "33", "34"].includes(prefix2)) return "Rajasthan";
  if (["36", "37", "38", "39"].includes(prefix2)) {
    if (prefix3 === "396") return "Dadra and Nagar Haveli and Daman and Diu";
    return "Gujarat";
  }
  if (["40", "41", "42", "43", "44"].includes(prefix2)) {
    if (prefix3 === "403") return "Goa";
    return "Maharashtra";
  }
  if (["45", "46", "47", "48"].includes(prefix2)) return "Madhya Pradesh";
  if (prefix2 === "49") return "Chhattisgarh";
  if (["50", "51", "52", "53"].includes(prefix2)) return "Andhra Pradesh"; // can also be Telangana
  if (["56", "57", "58", "59"].includes(prefix2)) return "Karnataka";
  if (["60", "61", "62", "63", "64"].includes(prefix2)) {
    if (prefix3 === "605") return "Puducherry";
    return "Tamil Nadu";
  }
  if (["67", "68", "69"].includes(prefix2)) {
    if (prefix3 === "682") return "Lakshadweep";
    return "Kerala";
  }
  if (["70", "71", "72", "73", "74"].includes(prefix2)) {
    if (prefix3 === "744") return "Andaman and Nicobar Islands";
    if (prefix3 === "737") return "Sikkim";
    return "West Bengal";
  }
  if (["75", "76", "77"].includes(prefix2)) return "Odisha";
  if (prefix2 === "78") return "Assam";
  if (prefix3 === "790" || prefix3 === "791" || prefix3 === "792") return "Arunachal Pradesh";
  if (prefix3 === "793" || prefix3 === "794") return "Meghalaya";
  if (prefix3 === "795") return "Manipur";
  if (prefix3 === "796") return "Mizoram";
  if (prefix3 === "797" || prefix3 === "798") return "Nagaland";
  if (prefix3 === "799") return "Tripura";
  if (["80", "81", "82", "83", "84", "85"].includes(prefix2)) {
    const prefix3Num = parseInt(prefix3);
    if (prefix3Num === 814 || prefix3Num === 815 || (prefix3Num >= 825 && prefix3Num <= 835)) {
      return "Jharkhand";
    }
    return "Bihar";
  }
  
  return "Default";
}

export function calculateWeightBasedShippingCharge(
  weightGrams: number,
  state: string,
  stateShippingCharges?: { stateName: string; maxWeightGrams: number; charge: number; }[]
): number {
  const normState = (state || "Default").trim().toLowerCase();
  const chargesList = stateShippingCharges || [];

  // Filter rules for this specific state
  const stateRules = chargesList.filter(r => r.stateName.toLowerCase() === normState);
  
  // Sort state rules by max weight limit ascending
  stateRules.sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
  
  // Find matching rule
  let matchedRule = stateRules.find(r => r.maxWeightGrams >= weightGrams);
  
  if (matchedRule) {
    return matchedRule.charge;
  }
  
  // If weight exceeds all custom rules for this state, or no rules exist for this state
  if (stateRules.length > 0) {
    return stateRules[stateRules.length - 1].charge;
  }
  
  // If no rules for the state, try Default rules
  const defaultRules = chargesList.filter(r => r.stateName.toLowerCase() === "default");
  defaultRules.sort((a, b) => a.maxWeightGrams - b.maxWeightGrams);
  
  let matchedDefaultRule = defaultRules.find(r => r.maxWeightGrams >= weightGrams);
  if (matchedDefaultRule) {
    return matchedDefaultRule.charge;
  }
  
  if (defaultRules.length > 0) {
    return defaultRules[defaultRules.length - 1].charge;
  }
  
  // Hardcoded default fallbacks: WB 70 rs, outside WB 100 rs per 500g category
  const multiplier = Math.ceil(weightGrams / 500);
  const isWB = normState === "west bengal" || normState === "wb";
  const baseRate = isWB ? 70 : 100;
  return baseRate * multiplier;
}

export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 500, // ₹500 minimum for free shipping
  STANDARD_SHIPPING_CHARGE: 48, // ₹48 shipping charge
} as const;

/**
 * Calculate shipping charge based on order value
 * @param itemsPrice - Total price of items in the cart
 * @returns shipping charge amount
 */
export function calculateShippingCharge(itemsPrice: number): number {
  if (itemsPrice >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) {
    return 0; // Free shipping
  }
  return SHIPPING_CONFIG.STANDARD_SHIPPING_CHARGE;
}

/**
 * Check if order qualifies for free shipping
 * @param itemsPrice - Total price of items in the cart
 * @returns boolean indicating if shipping is free
 */
export function qualifiesForFreeShipping(itemsPrice: number): boolean {
  return itemsPrice >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
}

/**
 * Get shipping display text
 * @param itemsPrice - Total price of items in the cart
 * @returns formatted shipping display text
 */
export function getShippingDisplayText(itemsPrice: number): string {
  if (qualifiesForFreeShipping(itemsPrice)) {
    return "FREE DELIVERY";
  }
  return `₹${SHIPPING_CONFIG.STANDARD_SHIPPING_CHARGE} Shipping`;
}

/**
 * Calculate how much more is needed for free shipping
 * @param itemsPrice - Total price of items in the cart
 * @returns amount needed for free shipping (0 if already qualifies)
 */
export function getAmountNeededForFreeShipping(itemsPrice: number): number {
  if (qualifiesForFreeShipping(itemsPrice)) {
    return 0;
  }
  return SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD - itemsPrice;
}