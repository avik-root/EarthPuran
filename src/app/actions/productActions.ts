
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { Product, Review } from '@/types/product';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

async function readProductsFile(): Promise<Product[]> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(jsonData) as Product[];
  } catch (error) {
    console.error("Failed to read products file:", error);
    return [];
  }
}

async function writeProductsFile(products: Product[]): Promise<void> {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(products, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write products file:", error);
    throw new Error("Could not save product data.");
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
  // Sort by rating if available, otherwise just take first few
  return products.sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
}

export type NewReviewData = Omit<Review, 'id' | 'date'>;

export async function addProductReview(
  productId: string,
  reviewData: NewReviewData
): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!reviewData.userEmail || !reviewData.userName || !reviewData.comment || reviewData.rating === undefined) {
    return { success: false, error: "Missing review data." };
  }
  if (reviewData.rating < 1 || reviewData.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }

  try {
    const products = await readProductsFile();
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return { success: false, error: "Product not found." };
    }

    const product = products[productIndex];

    const newReview: Review = {
      ...reviewData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // More unique ID
      date: new Date().toISOString(),
    };

    if (!product.productReviews) {
      product.productReviews = [];
    }
    product.productReviews.push(newReview);
    product.productReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by newest first

    // Recalculate average rating and review count
    if (product.productReviews.length > 0) {
      const totalRating = product.productReviews.reduce((sum, review) => sum + review.rating, 0);
      product.rating = parseFloat((totalRating / product.productReviews.length).toFixed(1));
      product.reviews = product.productReviews.length;
    } else {
      product.rating = 0;
      product.reviews = 0;
    }
    
    products[productIndex] = product;
    await writeProductsFile(products);

    return { success: true, product: product };
  } catch (error) {
    console.error("Error adding product review:", error);
    return { success: false, error: "Could not add review to product." };
  }
}
