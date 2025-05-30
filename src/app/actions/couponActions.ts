
// src/app/actions/couponActions.ts
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { Coupon } from '@/types/coupon';
import { revalidatePath } from 'next/cache';

const couponsFilePath = path.join(process.cwd(), 'src', 'data', 'coupons.json');

async function readCouponsFile(): Promise<Coupon[]> {
  try {
    const jsonData = await fs.readFile(couponsFilePath, 'utf-8');
    if (!jsonData.trim()) {
      // If the file is empty, initialize with an empty array
      await fs.writeFile(couponsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    return JSON.parse(jsonData) as Coupon[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // If file doesn't exist, create it with an empty array
      await fs.writeFile(couponsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("Failed to read coupons.json:", error);
    // In case of other errors (e.g., parse error), return empty or throw
    // For robustness, returning empty array for this prototype.
    return []; 
  }
}

async function writeCouponsFile(coupons: Coupon[]): Promise<void> {
  try {
    await fs.writeFile(couponsFilePath, JSON.stringify(coupons, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to coupons.json:", error);
    throw new Error("Could not save coupon data.");
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  return await readCouponsFile();
}

export async function addCoupon(
  couponData: Omit<Coupon, 'id'>
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  if (!couponData.code || couponData.value === undefined) {
    return { success: false, error: "Coupon code and value are required." };
  }

  try {
    const coupons = await readCouponsFile();
    
    // Check for duplicate coupon code
    if (coupons.some(c => c.code.toUpperCase() === couponData.code.toUpperCase())) {
      return { success: false, error: `Coupon code "${couponData.code}" already exists.` };
    }

    const newCoupon: Coupon = {
      ...couponData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      code: couponData.code.toUpperCase(), // Ensure code is stored uppercase
    };

    coupons.push(newCoupon);
    await writeCouponsFile(coupons);

    revalidatePath('/admin/customs/coupons');
    // Revalidate cart if needed, though client-side fetch on cart page might be sufficient
    // revalidatePath('/cart'); 

    return { success: true, coupon: newCoupon };
  } catch (error) {
    console.error("Error adding coupon:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not add coupon. ${errorMessage}` };
  }
}

export async function deleteCoupon(
  couponId: string
): Promise<{ success: boolean; error?: string }> {
  if (!couponId) {
    return { success: false, error: "Coupon ID is required." };
  }

  try {
    let coupons = await readCouponsFile();
    const initialLength = coupons.length;
    coupons = coupons.filter(coupon => coupon.id !== couponId);

    if (coupons.length === initialLength) {
      return { success: false, error: "Coupon not found." };
    }

    await writeCouponsFile(coupons);
    revalidatePath('/admin/customs/coupons');
    // revalidatePath('/cart');

    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not delete coupon. ${errorMessage}` };
  }
}
