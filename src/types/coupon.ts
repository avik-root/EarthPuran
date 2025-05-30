
// src/types/coupon.ts

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiryDate?: string; // YYYY-MM-DD
  minSpend?: number;
  usageLimit?: number; // How many times this coupon can be used in total
  // Example: uses?: number; // How many times it has been used (for future extension)
}
