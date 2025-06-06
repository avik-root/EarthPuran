
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { Product, Review, ColorVariant } from '@/types/product';
import { revalidatePath } from 'next/cache';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

async function readProductsFile(): Promise<Product[]> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    if (!jsonData.trim()) {
      console.warn("products.json is empty, re-initializing with [].");
      await fs.writeFile(dataFilePath, JSON.stringify([], null, 2), 'utf-8'); // Ensure file is valid JSON
      return [];
    }
    try {
      return JSON.parse(jsonData) as Product[];
    } catch (parseError) {
      console.error("Failed to parse products.json. File content may be corrupted. Content snippet (first 500 chars):", jsonData.substring(0, 500), "Error:", parseError);
      console.warn("Returning empty array due to products.json parse error. Please check the file content. Consider backing up and deleting/re-initializing products.json if the issue persists.");
      return [];
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
        console.warn("products.json not found, creating it with [].");
        await fs.writeFile(dataFilePath, JSON.stringify([], null, 2), 'utf-8'); // Create if not exists
        return [];
    }
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
  return products.sort((a,b) => b.id.localeCompare(a.id)).slice(0, limit);
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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      date: new Date().toISOString(),
    };

    if (!product.productReviews) {
      product.productReviews = [];
    }
    product.productReviews.push(newReview);
    product.productReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);

    return { success: true, product: product };
  } catch (error) {
    console.error("Error adding product review:", error);
    return { success: false, error: "Could not add review to product." };
  }
}

export type ProductFormData = {
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  imageUrl?: string;
  imageHint?: string;
  additionalImageUrls?: string[];
  colors?: ColorVariant[];
};

export async function addProduct(
  productInputData: ProductFormData
): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!productInputData.name || !productInputData.category || !productInputData.brand || productInputData.price === undefined || productInputData.stock === undefined) {
    return { success: false, error: "Missing essential product data (name, category, brand, price, stock)." };
  }

  try {
    const products = await readProductsFile();
    const newId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    const newProduct: Product = {
      id: newId,
      name: productInputData.name,
      description: productInputData.description,
      price: productInputData.price,
      category: productInputData.category,
      brand: productInputData.brand,
      stock: productInputData.stock,
      imageUrl: productInputData.imageUrl || "https://placehold.co/600x400.png",
      imageHint: productInputData.imageHint || "product image",
      additionalImageUrls: productInputData.additionalImageUrls || [],
      colors: productInputData.colors || [],
      rating: 0,
      reviews: 0,
      productReviews: [],
      tags: [] 
    };

    products.push(newProduct);
    await writeProductsFile(products);

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath('/admin/products');


    return { success: true, product: newProduct };
  } catch (error) {
    console.error("Error adding product in action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not add product to file. ${errorMessage}` };
  }
}

export async function updateProductById(
  productId: string,
  productUpdateData: ProductFormData
): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!productId) {
    return { success: false, error: "Product ID is required for update." };
  }
  if (!productUpdateData.name || !productUpdateData.category || !productUpdateData.brand || productUpdateData.price === undefined || productUpdateData.stock === undefined) {
    return { success: false, error: "Missing essential product data (name, category, brand, price, stock)." };
  }

  try {
    const products = await readProductsFile();
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      return { success: false, error: "Product not found." };
    }

    // Preserve existing review data and rating if not explicitly changed by form
    const existingProduct = products[productIndex];
    const updatedProduct: Product = {
      ...existingProduct, // Preserve ID, reviews, rating, etc.
      name: productUpdateData.name,
      description: productUpdateData.description,
      price: productUpdateData.price,
      category: productUpdateData.category,
      brand: productUpdateData.brand,
      stock: productUpdateData.stock,
      imageUrl: productUpdateData.imageUrl || existingProduct.imageUrl || "https://placehold.co/600x400.png",
      imageHint: productUpdateData.imageHint || existingProduct.imageHint || "product image",
      additionalImageUrls: productUpdateData.additionalImageUrls || existingProduct.additionalImageUrls || [],
      colors: productUpdateData.colors || existingProduct.colors || [],
      // Keep existingProduct.tags, rating, reviews, productReviews unless the form also modifies them
    };

    products[productIndex] = updatedProduct;
    await writeProductsFile(products);

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/edit/${productId}`);


    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Error updating product in action:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not update product in file. ${errorMessage}` };
  }
}


export async function deleteProductById(productId: string): Promise<{ success: boolean; message: string }> {
  if (!productId) {
    return { success: false, message: "Product ID is required." };
  }

  try {
    let products = await readProductsFile();
    const productToDelete = products.find(p => p.id === productId);
    const initialLength = products.length;
    products = products.filter(product => product.id !== productId);

    if (products.length === initialLength) {
      return { success: false, message: "Product not found." };
    }

    await writeProductsFile(products);

    revalidatePath('/');
    revalidatePath('/products');
    revalidatePath('/admin/products');
    if (productToDelete) {
      revalidatePath(`/products/${productToDelete.id}`); 
    }
    
    return { success: true, message: "Product deleted successfully." };
  } catch (error) {
    console.error("Error deleting product:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while deleting product.";
    return { success: false, message: errorMessage };
  }
}

