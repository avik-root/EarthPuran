
"use server";

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AllUsersData, UserData, UserProfile, UserAddress, WishlistProduct, FullCartItem } from '@/types/userData';
import type { Product } from '@/types/product';
import type { Order } from '@/types/order';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');
const saltRounds = 10;

async function readUsersFile(): Promise<AllUsersData> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    if (!jsonData.trim()) {
      console.log("users.json is empty, initializing with {}.");
      await fs.writeFile(dataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    try {
      return JSON.parse(jsonData) as AllUsersData;
    } catch (parseError) {
      console.error("Failed to parse users.json. File content may be corrupted. Content snippet (first 500 chars):", jsonData.substring(0, 500), "Error:", parseError);
      console.warn("Returning empty data due to users.json parse error. Please check the file content. Consider backing up and deleting/re-initializing users.json if the issue persists.");
      return {};
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      console.log("users.json not found, creating it with {}.");
      await fs.writeFile(dataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    console.error("Failed to read users.json:", nodeError);
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

function getDefaultUserData(profile: Omit<UserProfile, 'hashedPassword' | 'hashedPin' | 'isAdmin'>, plaintextPassword_prototype_only: string, plaintextPin_prototype_only: string, makeAdmin: boolean = false): UserData {
    const hashedPassword = bcrypt.hashSync(plaintextPassword_prototype_only, saltRounds);
    const hashedPin = bcrypt.hashSync(plaintextPin_prototype_only, saltRounds);
    
    const userProfileWithHashes: UserProfile = {
        ...profile,
        hashedPassword,
        hashedPin,
        isAdmin: makeAdmin,
    };
    
    return {
        profile: userProfileWithHashes,
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
  return allUsers[email.toLowerCase()] || null;
}

export async function initializeUserAccount(profile: Omit<UserProfile, 'hashedPassword' | 'hashedPin' | 'isAdmin'>, plaintextPassword_prototype_only: string, plaintextPin_prototype_only: string): Promise<UserData> {
    const allUsers = await readUsersFile();
    const normalizedEmail = profile.email.toLowerCase();
    if (allUsers[normalizedEmail]) {
        throw new Error(`User with email ${profile.email} already exists.`);
    }
    // No longer automatically making the first user an admin. Admin is handled via /admin/login flow.
    allUsers[normalizedEmail] = getDefaultUserData(profile, plaintextPassword_prototype_only, plaintextPin_prototype_only, false);
    await writeUsersFile(allUsers);
    return allUsers[normalizedEmail];
}

export async function updateUserProfile(email: string, profileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'countryCode' | 'phoneNumber'>>): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    if (!allUsers[normalizedEmail]) {
      console.error(`Attempted to update profile for non-existent user: ${email}`);
      return false;
    }
    
    allUsers[normalizedEmail].profile = { 
        ...allUsers[normalizedEmail].profile, 
        ...profileData,
     };
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserPasswordAction(email: string, currentPlaintextPassword_prototype_only: string, newPlaintextPassword_prototype_only: string): Promise<{success: boolean, message: string}> {
    if (!email) return {success: false, message: "Email not provided."};
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    const userData = allUsers[normalizedEmail];

    if (!userData || !userData.profile.hashedPassword) {
      return {success: false, message: "User not found or no password set."};
    }

    const isCurrentPasswordValid = bcrypt.compareSync(currentPlaintextPassword_prototype_only, userData.profile.hashedPassword);
    if (!isCurrentPasswordValid) {
        return {success: false, message: "Current password does not match."};
    }

    userData.profile.hashedPassword = bcrypt.hashSync(newPlaintextPassword_prototype_only, saltRounds);
    await writeUsersFile(allUsers);
    return {success: true, message: "Password updated successfully."};
}

export async function updateUserPinAction(email: string, currentPlaintextPin_prototype_only: string, newPlaintextPin_prototype_only: string): Promise<{success: boolean, message: string}> {
    if (!email) return {success: false, message: "Email not provided."};
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    const userData = allUsers[normalizedEmail];

    if (!userData || !userData.profile.hashedPin) {
      return {success: false, message: "User not found or no PIN set."};
    }

    const isCurrentPinValid = bcrypt.compareSync(currentPlaintextPin_prototype_only, userData.profile.hashedPin);
    if (!isCurrentPinValid) {
        return {success: false, message: "Current PIN does not match."};
    }
    
    userData.profile.hashedPin = bcrypt.hashSync(newPlaintextPin_prototype_only, saltRounds);
    await writeUsersFile(allUsers);
    return {success: true, message: "PIN updated successfully."};
}


export async function updateUserAddresses(email: string, addresses: UserAddress[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
     if (!allUsers[normalizedEmail]) {
      console.error(`Attempted to update addresses for non-existent user: ${email}`);
      return false;
    }
    allUsers[normalizedEmail].addresses = addresses;
    await writeUsersFile(allUsers);
    return true;
}

export async function addOrder(email: string, newOrder: Order): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    if (!allUsers[normalizedEmail]) {
      console.error(`Attempted to add order for non-existent user: ${email}`);
      return false;
    }
    allUsers[normalizedEmail].orders.push(newOrder);
    allUsers[normalizedEmail].orders.sort((a, b) => parseInt(b.id) - parseInt(a.id)); 
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserOrders(email: string, updatedOrders: Order[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    if (!allUsers[normalizedEmail]) {
        console.error(`Attempted to update orders for non-existent user: ${email}`);
        return false;
    }
    allUsers[normalizedEmail].orders = updatedOrders;
    await writeUsersFile(allUsers);
    return true;
}

// --- Wishlist Actions ---
export async function addProductToWishlistAction(email: string, product: Product): Promise<{ success: boolean; wishlist?: Product[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Wishlist: User ${email} not found.`);
    return { success: false };
  }
  if (!allUsers[normalizedEmail].wishlist.find(p => p.id === product.id)) {
    allUsers[normalizedEmail].wishlist.push(product);
    await writeUsersFile(allUsers);
  }
  return { success: true, wishlist: allUsers[normalizedEmail].wishlist };
}

export async function removeProductFromWishlistAction(email: string, productId: string): Promise<{ success: boolean; wishlist?: Product[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Wishlist: User ${email} not found.`);
    return { success: false };
  }
  const initialLength = allUsers[normalizedEmail].wishlist.length;
  allUsers[normalizedEmail].wishlist = allUsers[normalizedEmail].wishlist.filter(p => p.id !== productId);
  if (allUsers[normalizedEmail].wishlist.length < initialLength) {
    await writeUsersFile(allUsers);
  }
  return { success: true, wishlist: allUsers[normalizedEmail].wishlist };
}

export async function clearUserWishlistAction(email: string): Promise<{ success: boolean; wishlist?: Product[] }> {
    if (!email) return { success: false };
    const allUsers = await readUsersFile();
    const normalizedEmail = email.toLowerCase();
    if (!allUsers[normalizedEmail]) {
        console.error(`Wishlist: User ${email} not found.`);
        return { success: false };
    }
    allUsers[normalizedEmail].wishlist = [];
    await writeUsersFile(allUsers);
    return { success: true, wishlist: allUsers[normalizedEmail].wishlist };
}

// --- Cart Actions ---
export async function addItemToUserCartAction(email: string, product: Product, quantity: number): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email || quantity <= 0) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const existingItemIndex = allUsers[normalizedEmail].cart.findIndex(item => item.product.id === product.id);
  if (existingItemIndex > -1) {
    const newQuantity = allUsers[normalizedEmail].cart[existingItemIndex].quantity + quantity;
    allUsers[normalizedEmail].cart[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
  } else {
    allUsers[normalizedEmail].cart.push({ product, quantity: Math.min(quantity, product.stock) });
  }
  await writeUsersFile(allUsers);
  return { success: true, cart: allUsers[normalizedEmail].cart };
}

export async function removeItemFromUserCartAction(email: string, productId: string): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const initialLength = allUsers[normalizedEmail].cart.length;
  allUsers[normalizedEmail].cart = allUsers[normalizedEmail].cart.filter(item => item.product.id !== productId);
  if (allUsers[normalizedEmail].cart.length < initialLength) {
    await writeUsersFile(allUsers);
  }
  return { success: true, cart: allUsers[normalizedEmail].cart };
}

export async function updateUserItemQuantityInCartAction(email: string, productId: string, newQuantity: number): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  const itemIndex = allUsers[normalizedEmail].cart.findIndex(item => item.product.id === productId);
  if (itemIndex > -1) {
    if (newQuantity <= 0) {
      allUsers[normalizedEmail].cart.splice(itemIndex, 1); 
    } else {
      allUsers[normalizedEmail].cart[itemIndex].quantity = Math.min(newQuantity, allUsers[normalizedEmail].cart[itemIndex].product.stock);
    }
    await writeUsersFile(allUsers);
  }
  return { success: true, cart: allUsers[normalizedEmail].cart };
}

export async function clearUserCartAction(email: string): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail]) {
    console.error(`Cart: User ${email} not found.`);
    return { success: false };
  }
  allUsers[normalizedEmail].cart = [];
  await writeUsersFile(allUsers);
  return { success: true, cart: allUsers[normalizedEmail].cart };
}
