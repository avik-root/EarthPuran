
"use server";

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const globalDiscountFilePath = path.join(process.cwd(), 'src', 'data', 'globalDiscount.json');
const DEFAULT_DISCOUNT_PERCENTAGE = 0;

interface GlobalDiscountData {
  percentage: number;
}

async function readGlobalDiscountFile(): Promise<GlobalDiscountData> {
  try {
    const jsonData = await fs.readFile(globalDiscountFilePath, 'utf-8');
    if (!jsonData.trim()) {
      await fs.writeFile(globalDiscountFilePath, JSON.stringify({ percentage: DEFAULT_DISCOUNT_PERCENTAGE }, null, 2), 'utf-8');
      return { percentage: DEFAULT_DISCOUNT_PERCENTAGE };
    }
    const parsedData = JSON.parse(jsonData) as GlobalDiscountData;
    if (typeof parsedData.percentage !== 'number' || isNaN(parsedData.percentage)) {
        console.warn("Invalid discount percentage in globalDiscount.json, using default.");
        return { percentage: DEFAULT_DISCOUNT_PERCENTAGE };
    }
    return parsedData;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      await fs.writeFile(globalDiscountFilePath, JSON.stringify({ percentage: DEFAULT_DISCOUNT_PERCENTAGE }, null, 2), 'utf-8');
      return { percentage: DEFAULT_DISCOUNT_PERCENTAGE };
    }
    console.error("Failed to read globalDiscount.json:", error);
    return { percentage: DEFAULT_DISCOUNT_PERCENTAGE };
  }
}

async function writeGlobalDiscountFile(data: GlobalDiscountData): Promise<void> {
  try {
    await fs.writeFile(globalDiscountFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to globalDiscount.json:", error);
    throw new Error("Could not save global discount data.");
  }
}

export async function getGlobalDiscountPercentage(): Promise<{ percentage: number }> {
  const data = await readGlobalDiscountFile();
  return { percentage: data.percentage };
}

export async function updateGlobalDiscountPercentage(
  newPercentage: number
): Promise<{ success: boolean; percentage?: number; error?: string }> {
  if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
    return { success: false, error: "Discount percentage must be a number between 0 and 100." };
  }

  try {
    await writeGlobalDiscountFile({ percentage: newPercentage });
    revalidatePath('/admin/customs/discounts');
    // If this discount is applied in the cart, revalidate those paths too
    // revalidatePath('/cart');
    // revalidatePath('/checkout'); 
    // revalidatePath('/products'); // If prices shown are discounted
    return { success: true, percentage: newPercentage };
  } catch (error) {
    console.error("Error updating global discount percentage:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not update global discount. ${errorMessage}` };
  }
}
