
"use server";

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AllUsersData, UserData, UserProfile, UserAddress, Order, Product as WishlistProduct, FullCartItem } from '@/types/userData';
import type { Product } from '@/types/product';

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
      return {}; // Or throw new Error("Failed to parse user data."); for stricter error handling
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      console.log("users.json not found, creating it with {}.");
      await fs.writeFile(dataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    console.error("Failed to read users.json:", nodeError);
    // Depending on the desired behavior, you might want to throw an error here
    // or return a state that indicates failure to the calling action.
    // Returning an empty object can mask issues if the caller isn't prepared for it.
    return {}; // Fallback for other read errors
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

function getDefaultUserData(profile: UserProfile, plaintextPassword_prototype_only: string, plaintextPin_prototype_only: string): UserData {
    const hashedPassword = bcrypt.hashSync(plaintextPassword_prototype_only, saltRounds);
    const hashedPin = bcrypt.hashSync(plaintextPin_prototype_only, saltRounds);
    
    return {
        profile: {
            ...profile,
            hashedPassword,
            hashedPin,
        },
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

export async function initializeUserAccount(profile: UserProfile, plaintextPassword_prototype_only: string, plaintextPin_prototype_only: string): Promise<UserData> {
    const allUsers = await readUsersFile();
    if (allUsers[profile.email]) {
        throw new Error(`User with email ${profile.email} already exists.`);
    }
    allUsers[profile.email] = getDefaultUserData(profile, plaintextPassword_prototype_only, plaintextPin_prototype_only);
    await writeUsersFile(allUsers);
    return allUsers[profile.email];
}

export async function updateUserProfile(email: string, profileData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'countryCode' | 'phoneNumber'>>): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
      console.error(`Attempted to update profile for non-existent user: ${email}`);
      return false;
    }
    
    allUsers[email].profile = { 
        ...allUsers[email].profile, 
        ...profileData,
     };
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserPasswordAction(email: string, currentPlaintextPassword_prototype_only: string, newPlaintextPassword_prototype_only: string): Promise<{success: boolean, message: string}> {
    if (!email) return {success: false, message: "Email not provided."};
    const allUsers = await readUsersFile();
    const userData = allUsers[email];

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
    const userData = allUsers[email];

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
      allUsers[email].cart.splice(itemIndex, 1); // Remove item if quantity is 0 or less
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

