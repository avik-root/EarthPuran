
"use server";

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const taxFilePath = path.join(process.cwd(), 'src', 'data', 'tax.json');
const DEFAULT_TAX_RATE = 18; // Default tax rate percentage

interface TaxData {
  rate: number;
}

async function readTaxFile(): Promise<TaxData> {
  try {
    const jsonData = await fs.readFile(taxFilePath, 'utf-8');
    if (!jsonData.trim()) {
      await fs.writeFile(taxFilePath, JSON.stringify({ rate: DEFAULT_TAX_RATE }, null, 2), 'utf-8');
      return { rate: DEFAULT_TAX_RATE };
    }
    const parsedData = JSON.parse(jsonData) as TaxData;
    if (typeof parsedData.rate !== 'number' || isNaN(parsedData.rate)) {
        console.warn("Invalid tax rate in tax.json, using default.");
        return { rate: DEFAULT_TAX_RATE };
    }
    return parsedData;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      await fs.writeFile(taxFilePath, JSON.stringify({ rate: DEFAULT_TAX_RATE }, null, 2), 'utf-8');
      return { rate: DEFAULT_TAX_RATE };
    }
    console.error("Failed to read tax.json:", error);
    return { rate: DEFAULT_TAX_RATE };
  }
}

async function writeTaxFile(data: TaxData): Promise<void> {
  try {
    await fs.writeFile(taxFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to tax.json:", error);
    throw new Error("Could not save tax data.");
  }
}

export async function getTaxRate(): Promise<{ rate: number }> {
  const data = await readTaxFile();
  return { rate: data.rate };
}

export async function updateTaxRate(
  newRate: number
): Promise<{ success: boolean; rate?: number; error?: string }> {
  if (isNaN(newRate) || newRate < 0 || newRate > 100) {
    return { success: false, error: "Tax rate must be a number between 0 and 100." };
  }

  try {
    await writeTaxFile({ rate: newRate });
    revalidatePath('/admin/customs/taxes');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    return { success: true, rate: newRate };
  } catch (error) {
    console.error("Error updating tax rate:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not update tax rate. ${errorMessage}` };
  }
}
