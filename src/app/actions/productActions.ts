"use server";

import fs from 'fs/promises';
import path from 'path';
import type { Product } from '@/types/product';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

async function readProductsFile(): Promise<Product[]> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(jsonData) as Product[];
  } catch (error) {
    console.error("Failed to read products file:", error);
    // In a real app, you might want to throw the error or return a more specific error state
    return []; // Return empty array if file doesn't exist or error occurs
  }
}

export async function getProducts(): Promise<Product[]> {
  return await readProductsFile();
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await readProductsFile();
  const product = products.find(p => p.id === id);
  return product || null;
}

export async function getFeaturedProducts(limit: number = 4): Promise<Product[]> {
  const products = await readProductsFile();
  // For now, just take the first few products as "featured"
  // In a real app, this could be based on rating, sales, or a specific "featured" flag
  return products.sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
}
