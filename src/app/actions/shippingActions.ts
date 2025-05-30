
"use server";

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';
import type { ShippingSettings } from '@/types/shipping';

const shippingSettingsFilePath = path.join(process.cwd(), 'src', 'data', 'shippingSettings.json');
const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  rate: 50, // Default flat rate
  threshold: 5000, // Default free shipping threshold
};

async function readShippingSettingsFile(): Promise<ShippingSettings> {
  try {
    const jsonData = await fs.readFile(shippingSettingsFilePath, 'utf-8');
    if (!jsonData.trim()) {
      await fs.writeFile(shippingSettingsFilePath, JSON.stringify(DEFAULT_SHIPPING_SETTINGS, null, 2), 'utf-8');
      return DEFAULT_SHIPPING_SETTINGS;
    }
    const parsedData = JSON.parse(jsonData) as ShippingSettings;
    // Validate data types
    if (typeof parsedData.rate !== 'number' || isNaN(parsedData.rate) ||
        typeof parsedData.threshold !== 'number' || isNaN(parsedData.threshold)) {
        console.warn("Invalid shipping settings in shippingSettings.json, using defaults.");
        return DEFAULT_SHIPPING_SETTINGS;
    }
    return parsedData;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      await fs.writeFile(shippingSettingsFilePath, JSON.stringify(DEFAULT_SHIPPING_SETTINGS, null, 2), 'utf-8');
      return DEFAULT_SHIPPING_SETTINGS;
    }
    console.error("Failed to read shippingSettings.json:", error);
    return DEFAULT_SHIPPING_SETTINGS;
  }
}

async function writeShippingSettingsFile(data: ShippingSettings): Promise<void> {
  try {
    await fs.writeFile(shippingSettingsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to shippingSettings.json:", error);
    throw new Error("Could not save shipping settings data.");
  }
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  return await readShippingSettingsFile();
}

export async function updateShippingSettings(
  settings: ShippingSettings
): Promise<{ success: boolean; settings?: ShippingSettings; error?: string }> {
  if (isNaN(settings.rate) || settings.rate < 0 || isNaN(settings.threshold) || settings.threshold < 0) {
    return { success: false, error: "Shipping rate and threshold must be non-negative numbers." };
  }

  try {
    await writeShippingSettingsFile(settings);
    revalidatePath('/admin/customs/shipping');
    revalidatePath('/products'); 
    revalidatePath('/cart');
    revalidatePath('/checkout');
    return { success: true, settings };
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not update shipping settings. ${errorMessage}` };
  }
}
