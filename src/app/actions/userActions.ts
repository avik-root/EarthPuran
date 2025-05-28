
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { AllUsersData, UserData, UserProfile, UserAddress, Order, Product as WishlistProduct, FullCartItem } from '@/types/userData';
import type { Product } from '@/types/product';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');

async function readUsersFile(): Promise<AllUsersData> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    if (!jsonData.trim()) {
      // If the file is empty, initialize with an empty object
      await fs.writeFile(dataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    return JSON.parse(jsonData) as AllUsersData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(dataFilePath, JSON.stringify({}, null, 2), 'utf-8'); // Create file if not exists
      return {};
    }
    console.error("Failed to read or parse users.json:", error);
    return {};
  }
}

async function writeUsersFile(data: AllUsersData): Promise<void> {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to users.json:", error);
    throw new Error("Could not save user data.");
  }
}

function getDefaultUserData(profile: UserProfile): UserData {
    return {
        profile, // Profile now includes plaintext password and pin for prototype
        addresses: [],
        orders: [],
        wishlist: [],
        cart: [],
    };
}

export async function getUserData(email: string): Promise<UserData | null> {
  if (!email) {
    console.warn("getUserData called with no email");
    return null;
  }
  const allUsers = await readUsersFile();
  return allUsers[email] || null;
}

export async function initializeUserAccount(profile: UserProfile): Promise<UserData> {
    const allUsers = await readUsersFile();
    if (allUsers[profile.email]) {
        // Optionally, throw an error if user already exists, or just return existing data
        // For now, let's throw an error to prevent accidental overwrites via signup
        throw new Error(`User with email ${profile.email} already exists.`);
    }
    allUsers[profile.email] = getDefaultUserData(profile);
    await writeUsersFile(allUsers);
    return allUsers[profile.email];
}

export async function updateUserProfile(email: string, profileData: Partial<UserProfile>): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
      console.error(`Attempted to update profile for non-existent user: ${email}`);
      return false;
    }
    // Ensure password and pin are not accidentally wiped if not provided in partial update
    const existingPassword = allUsers[email].profile.password_plaintext_prototype_only;
    const existingPin = allUsers[email].profile.pin_plaintext_prototype_only;

    allUsers[email].profile = { 
        ...allUsers[email].profile, 
        ...profileData,
        // Preserve existing password/pin if not part of this specific update
        password_plaintext_prototype_only: profileData.password_plaintext_prototype_only || existingPassword,
        pin_plaintext_prototype_only: profileData.pin_plaintext_prototype_only || existingPin,
     };
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserAddresses(email: string, addresses: UserAddress[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
     if (!allUsers[email]) {
      console.error(`Attempted to update addresses for non-existent user: ${email}`);
      return false;
    }
    allUsers[email].addresses = addresses;
    await writeUsersFile(allUsers);
    return true;
}

export async function addOrder(email: string, newOrder: Order): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
      console.error(`Attempted to add order for non-existent user: ${email}`);
      return false;
    }
    allUsers[email].orders.push(newOrder);
    allUsers[email].orders.sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Sort by newest first
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserOrders(email: string, updatedOrders: Order[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
        console.error(`Attempted to update orders for non-existent user: ${email}`);
        return false;
    }
    allUsers[email].orders = updatedOrders;
    await writeUsersFile(allUsers);
    return true;
}

// --- Wishlist Actions ---
export async function addProductToWishlistAction(email: string, product: Product): Promise<{ success: boolean; wishlist?: Product[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Wishlist: User ${email} not found.`);
    return { success: false };
  }
  if (!allUsers[email].wishlist.find(p => p.id === product.id)) {
    allUsers[email].wishlist.push(product);
    await writeUsersFile(allUsers);
  }
  return { success: true, wishlist: allUsers[email].wishlist };
}

export async function removeProductFromWishlistAction(email: string, productId: string): Promise<{ success: boolean; wishlist?: Product[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Wishlist: User ${email} not found.`);
    return { success: false };
  }
  const initialLength = allUsers[email].wishlist.length;
  allUsers[email].wishlist = allUsers[email].wishlist.filter(p => p.id !== productId);
  if (allUsers[email].wishlist.length < initialLength) {
    await writeUsersFile(allUsers);
  }
  return { success: true, wishlist: allUsers[email].wishlist };
}

export async function clearUserWishlistAction(email: string): Promise<{ success: boolean; wishlist?: Product[] }> {
    if (!email) return { success: false };
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
        console.error(`Wishlist: User ${email} not found.`);
        return { success: false };
    }
    allUsers[email].wishlist = [];
    await writeUsersFile(allUsers);
    return { success: true, wishlist: allUsers[email].wishlist };
}

// --- Cart Actions ---
export async function addItemToUserCartAction(email: string, product: Product, quantity: number): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email || quantity <= 0) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const existingItemIndex = allUsers[email].cart.findIndex(item => item.product.id === product.id);
  if (existingItemIndex > -1) {
    const newQuantity = allUsers[email].cart[existingItemIndex].quantity + quantity;
    allUsers[email].cart[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
  } else {
    allUsers[email].cart.push({ product, quantity: Math.min(quantity, product.stock) });
  }
  await writeUsersFile(allUsers);
  return { success: true, cart: allUsers[email].cart };
}

export async function removeItemFromUserCartAction(email: string, productId: string): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const initialLength = allUsers[email].cart.length;
  allUsers[email].cart = allUsers[email].cart.filter(item => item.product.id !== productId);
  if (allUsers[email].cart.length < initialLength) {
    await writeUsersFile(allUsers);
  }
  return { success: true, cart: allUsers[email].cart };
}

export async function updateUserItemQuantityInCartAction(email: string, productId: string, newQuantity: number): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const itemIndex = allUsers[email].cart.findIndex(item => item.product.id === productId);
  if (itemIndex > -1) {
    if (newQuantity <= 0) {
      allUsers[email].cart.splice(itemIndex, 1);
    } else {
      allUsers[email].cart[itemIndex].quantity = Math.min(newQuantity, allUsers[email].cart[itemIndex].product.stock);
    }
    await writeUsersFile(allUsers);
  }
  return { success: true, cart: allUsers[email].cart };
}

export async function clearUserCartAction(email: string): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  if (!allUsers[email]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  allUsers[email].cart = [];
  await writeUsersFile(allUsers);
  return { success: true, cart: allUsers[email].cart };
}
