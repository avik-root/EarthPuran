
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { AllUsersData, UserData, UserProfile, UserAddress, Order, Product as WishlistProduct, FullCartItem } from '@/types/userData';
import type { Product } from '@/types/product'; // For WishlistProduct if it's just Product

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');

async function readUsersFile(): Promise<AllUsersData> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    if (!jsonData.trim()) {
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
    throw new Error("Could not save user data."); // Propagate error
  }
}

function getDefaultUserData(profile: UserProfile): UserData {
    return {
        profile,
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

// Called on signup to create the user's data structure
export async function initializeUserAccount(profile: UserProfile): Promise<UserData> {
    const allUsers = await readUsersFile();
    if (allUsers[profile.email]) {
        // console.warn(`User ${profile.email} already exists. Returning existing data.`);
        return allUsers[profile.email]; // Or throw error if signup should fail for existing email
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
    allUsers[email].profile = { ...allUsers[email].profile, ...profileData };
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
       // Optionally create user here if an order can create a guest user account
      return false;
    }
    allUsers[email].orders.push(newOrder);
    allUsers[email].orders.sort((a, b) => parseInt(b.id) - parseInt(a.id));
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


export async function updateUserWishlist(email: string, wishlist: WishlistProduct[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
      console.error(`Attempted to update wishlist for non-existent user: ${email}`);
      return false;
    }
    allUsers[email].wishlist = wishlist;
    await writeUsersFile(allUsers);
    return true;
}

export async function updateUserCart(email: string, cart: FullCartItem[]): Promise<boolean> {
    if (!email) return false;
    const allUsers = await readUsersFile();
    if (!allUsers[email]) {
      console.error(`Attempted to update cart for non-existent user: ${email}`);
      return false;
    }
    allUsers[email].cart = cart;
    await writeUsersFile(allUsers);
    return true;
}

// Helper to get current user's email from client-side localStorage.
// This is not a server action but a utility for client components.
// export const getCurrentUserEmailClient = (): string | null => {
//   if (typeof window !== 'undefined') {
//     return localStorage.getItem('currentUserEmail');
//   }
//   return null;
// };
