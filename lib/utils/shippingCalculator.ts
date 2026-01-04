/**
 * Shipping Calculator Utility
 * Calculates volumetric weight and chargeable weight for delivery charges
 */

export interface ShippingDimensions {
    length: number; // in cm
    breadth: number; // in cm (width)
    height: number; // in cm
    weight: number; // in kg (actual/dead weight)
    unit?: string;
}

/**
 * Calculate volumetric weight using the formula: (L × W × H) / 5000
 * This is the standard formula used by most delivery partners
 * 
 * @param length - Length in cm
 * @param breadth - Breadth/Width in cm
 * @param height - Height in cm
 * @returns Volumetric weight in kg
 */
export function calculateVolumetricWeight(
    length: number,
    breadth: number,
    height: number
): number {
    if (length <= 0 || breadth <= 0 || height <= 0) {
        return 0;
    }
    return (length * breadth * height) / 5000;
}

/**
 * Get the chargeable weight (max of actual weight and volumetric weight)
 * Delivery partners charge based on whichever is greater
 * 
 * @param actualWeight - Actual/dead weight in kg
 * @param volumetricWeight - Volumetric weight in kg
 * @returns Chargeable weight in kg
 */
export function getChargeableWeight(
    actualWeight: number,
    volumetricWeight: number
): number {
    return Math.max(actualWeight, volumetricWeight);
}

/**
 * Calculate chargeable weight from shipping dimensions
 * Combines volumetric weight calculation and chargeable weight determination
 * 
 * @param dimensions - Shipping dimensions object
 * @returns Chargeable weight in kg
 */
export function calculateChargeableWeight(
    dimensions: ShippingDimensions
): number {
    const volumetricWeight = calculateVolumetricWeight(
        dimensions.length,
        dimensions.breadth,
        dimensions.height
    );
    return getChargeableWeight(dimensions.weight, volumetricWeight);
}

/**
 * Calculate shipping info including both weights
 * 
 * @param dimensions - Shipping dimensions object
 * @returns Object with volumetric and chargeable weights
 */
export function getShippingInfo(dimensions: ShippingDimensions) {
    const volumetricWeight = calculateVolumetricWeight(
        dimensions.length,
        dimensions.breadth,
        dimensions.height
    );
    const chargeableWeight = getChargeableWeight(dimensions.weight, volumetricWeight);

    return {
        actualWeight: dimensions.weight,
        volumetricWeight: Number(volumetricWeight.toFixed(2)),
        chargeableWeight: Number(chargeableWeight.toFixed(2)),
        dimensions: {
            length: dimensions.length,
            breadth: dimensions.breadth,
            height: dimensions.height,
        },
    };
}
