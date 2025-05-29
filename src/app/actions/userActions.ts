
"use server";

import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { AllUsersData, UserData, UserProfile, UserAddress, FullCartItem } from '@/types/userData';
import type { Product } from '@/types/product';
import type { Order } from '@/types/order';
import { revalidatePath } from 'next/cache';

const usersDataFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');
const earthPuranAdminDataFilePath = path.join(process.cwd(), 'src', 'data', 'earthpuranadmin.json');
const saltRounds = 10;

async function readUsersFile(): Promise<AllUsersData> {
  try {
    const jsonData = await fs.readFile(usersDataFilePath, 'utf-8');
    if (!jsonData.trim()) {
      console.log("users.json is empty, initializing with {}.");
      await fs.writeFile(usersDataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    try {
      return JSON.parse(jsonData) as AllUsersData;
    } catch (parseError) {
      const nodeError = parseError as NodeJS.ErrnoException;
      console.error("Failed to parse users.json. File content may be corrupted. Content snippet (first 500 chars):", jsonData.substring(0, 500), "Error:", nodeError.message);
      console.warn("Returning empty data due to users.json parse error. Please check the file content. Consider backing up and deleting/re-initializing users.json if the issue persists.");
      return {};
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      console.log("users.json not found, creating it with {}.");
      await fs.writeFile(usersDataFilePath, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    console.error("Failed to read users.json:", nodeError);
    return {};
  }
}

async function writeUsersFile(data: AllUsersData): Promise<void> {
  try {
    await fs.writeFile(usersDataFilePath, JSON.stringify(data, null, 2), 'utf-8');
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

export async function getAllUsers(): Promise<UserData[]> {
  const allUsersData = await readUsersFile();
  return Object.values(allUsersData);
}

export async function deleteUserByEmail(email: string): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: "Email is required." };
  }
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();

  if (!allUsers[normalizedEmail]) {
    return { success: false, message: "User not found." };
  }

  delete allUsers[normalizedEmail];
  try {
    await writeUsersFile(allUsers);
    revalidatePath('/admin/users'); // Revalidate the admin users page
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`);
    return { success: true, message: "User deleted successfully." };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, message: "Could not delete user from file." };
  }
}


export async function initializeUserAccount(profile: Omit<UserProfile, 'hashedPassword' | 'hashedPin' | 'isAdmin'>, plaintextPassword_prototype_only: string, plaintextPin_prototype_only: string): Promise<UserData> {
    const allUsers = await readUsersFile();
    const normalizedEmail = profile.email.toLowerCase();
    if (allUsers[normalizedEmail]) {
        throw new Error(`User with email ${profile.email} already exists.`);
    }
    
    const isFirstUser = Object.keys(allUsers).length === 0;
    allUsers[normalizedEmail] = getDefaultUserData(profile, plaintextPassword_prototype_only, plaintextPin_prototype_only, isFirstUser);
    await writeUsersFile(allUsers);
    revalidatePath('/admin/users');
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
    revalidatePath(`/profile`);
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`);
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
    revalidatePath(`/profile`);
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
    revalidatePath(`/profile`);
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
    revalidatePath(`/profile`);
    revalidatePath(`/checkout`);
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`);
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
    allUsers[normalizedEmail].orders.sort((a, b) => parseInt(b.id) - parseInt(a.id)); // Newest first
    await writeUsersFile(allUsers);
    revalidatePath(`/profile`);
    revalidatePath(`/orders`);
    revalidatePath(`/orders/${newOrder.id}`);
    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`);
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
    allUsers[normalizedEmail].orders = updatedOrders.sort((a,b) => parseInt(b.id) - parseInt(a.id)); // Ensure sort order
    await writeUsersFile(allUsers);
    revalidatePath(`/profile`);
    revalidatePath(`/orders`);
    updatedOrders.forEach(order => revalidatePath(`/orders/${order.id}`));
    revalidatePath(`/admin/orders`);
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`);
    return true;
}

export async function updateOrderStatus(customerEmail: string, orderId: string, newStatus: Order['status']): Promise<{ success: boolean; message: string; updatedOrder?: Order }> {
  if (!customerEmail || !orderId || !newStatus) {
    return { success: false, message: "Customer email, order ID, and new status are required." };
  }
  const allUsers = await readUsersFile();
  const normalizedEmail = customerEmail.toLowerCase();
  const userData = allUsers[normalizedEmail];

  if (!userData) {
    return { success: false, message: "Customer not found." };
  }

  const orderIndex = userData.orders.findIndex(order => order.id === orderId);
  if (orderIndex === -1) {
    return { success: false, message: "Order not found for this customer." };
  }

  userData.orders[orderIndex].status = newStatus;
  const updatedOrder = userData.orders[orderIndex];

  try {
    await writeUsersFile(allUsers);
    revalidatePath('/admin/orders');
    revalidatePath(`/orders/${orderId}`);
    revalidatePath(`/profile`); // To update user's view of their orders
    revalidatePath(`/admin/users/${encodeURIComponent(normalizedEmail)}`); // To update admin's view of user's orders
    return { success: true, message: `Order ${orderId} status updated to ${newStatus}.`, updatedOrder };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return { success: false, message: "Could not update order status in file." };
  }
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
  if (!allUsers[normalizedEmail].wishlist) {
    allUsers[normalizedEmail].wishlist = [];
  }
  if (!allUsers[normalizedEmail].wishlist.find(p => p.id === product.id)) {
    allUsers[normalizedEmail].wishlist.push(product);
    await writeUsersFile(allUsers);
    revalidatePath('/profile');
    revalidatePath('/wishlist');
  }
  return { success: true, wishlist: allUsers[normalizedEmail].wishlist };
}

export async function removeProductFromWishlistAction(email: string, productId: string): Promise<{ success: boolean; wishlist?: Product[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail] || !allUsers[normalizedEmail].wishlist) {
    console.error(`Wishlist: User ${email} not found or wishlist missing.`);
    return { success: false };
  }
  const initialLength = allUsers[normalizedEmail].wishlist.length;
  allUsers[normalizedEmail].wishlist = allUsers[normalizedEmail].wishlist.filter(p => p.id !== productId);
  if (allUsers[normalizedEmail].wishlist.length < initialLength) {
    await writeUsersFile(allUsers);
    revalidatePath('/profile');
    revalidatePath('/wishlist');
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
    revalidatePath('/profile');
    revalidatePath('/wishlist');
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
  if (!allUsers[normalizedEmail].cart) {
    allUsers[normalizedEmail].cart = [];
  }
  const existingItemIndex = allUsers[normalizedEmail].cart.findIndex(item => item.product.id === product.id);
  if (existingItemIndex > -1) {
    const newQuantity = allUsers[normalizedEmail].cart[existingItemIndex].quantity + quantity;
    allUsers[normalizedEmail].cart[existingItemIndex].quantity = Math.min(newQuantity, product.stock);
  } else {
    allUsers[normalizedEmail].cart.push({ product, quantity: Math.min(quantity, product.stock) });
  }
  await writeUsersFile(allUsers);
  revalidatePath('/cart');
  return { success: true, cart: allUsers[normalizedEmail].cart };
}

export async function removeItemFromUserCartAction(email: string, productId: string): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail] || !allUsers[normalizedEmail].cart) {
    console.error(`Cart: User ${email} not found or cart missing.`);
    return { success: false };
  }
  const initialLength = allUsers[normalizedEmail].cart.length;
  allUsers[normalizedEmail].cart = allUsers[normalizedEmail].cart.filter(item => item.product.id !== productId);
  if (allUsers[normalizedEmail].cart.length < initialLength) {
    await writeUsersFile(allUsers);
    revalidatePath('/cart');
  }
  return { success: true, cart: allUsers[normalizedEmail].cart };
}

export async function updateUserItemQuantityInCartAction(email: string, productId: string, newQuantity: number): Promise<{ success: boolean; cart?: FullCartItem[] }> {
  if (!email) return { success: false };
  const allUsers = await readUsersFile();
  const normalizedEmail = email.toLowerCase();
  if (!allUsers[normalizedEmail] || !allUsers[normalizedEmail].cart) {
    console.error(`Cart: User ${email} not found or cart missing.`);
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
    revalidatePath('/cart');
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
  revalidatePath('/cart');
  revalidatePath('/checkout'); // Also revalidate checkout as cart affects it
  return { success: true, cart: allUsers[normalizedEmail].cart };
}


// --- Admin Actions (earthpuranadmin.json) ---
interface EarthPuranAdminCredentials {
  email?: string;
  passwordHash?: string;
  pinHash?: string;
}

async function readEarthPuranAdminFile(): Promise<EarthPuranAdminCredentials> {
  try {
    const jsonData = await fs.readFile(earthPuranAdminDataFilePath, 'utf-8');
    if (!jsonData.trim()) return {}; // Empty file considered unconfigured
    return JSON.parse(jsonData) as EarthPuranAdminCredentials;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') return {}; // File not found considered unconfigured
    console.error("Failed to read or parse earthpuranadmin.json:", error);
    return {}; // Other errors also mean unconfigured for safety
  }
}

async function writeEarthPuranAdminFile(data: EarthPuranAdminCredentials): Promise<void> {
  try {
    await fs.writeFile(earthPuranAdminDataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to earthpuranadmin.json:", error);
    throw new Error("Could not save admin credentials.");
  }
}


export async function getEarthPuranAdminCredentials(): Promise<{
  configured: boolean;
  email?: string;
  passwordHash?: string;
  pinHash?: string;
  error?: string;
}> {
  try {
    const creds = await readEarthPuranAdminFile();

    if (
      creds.email && !creds.email.startsWith("REPLACE_WITH_ADMIN_EMAIL") &&
      creds.passwordHash && !creds.passwordHash.startsWith("REPLACE_WITH_BCRYPT_HASH") &&
      creds.pinHash && !creds.pinHash.startsWith("REPLACE_WITH_BCRYPT_HASH")
    ) {
      return {
        configured: true,
        email: creds.email,
        passwordHash: creds.passwordHash,
        pinHash: creds.pinHash,
      };
    }
    // If file exists but is empty or has placeholders, it's not configured.
    const jsonData = await fs.readFile(earthPuranAdminDataFilePath, 'utf-8').catch(() => "");
    if (!jsonData.trim()) {
         return { configured: false, error: "earthpuranadmin.json is empty. Please use the 'Create Admin Account' form." };
    }
    return { configured: false, error: "Admin credentials use placeholder values or are incomplete. Please use the 'Create Admin Account' form or manually configure earthpuranadmin.json." };
  } catch (error) { 
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // Create the file if it doesn't exist, with placeholder content to guide setup
      try {
        await fs.writeFile(earthPuranAdminDataFilePath, JSON.stringify({
          email: "REPLACE_WITH_ADMIN_EMAIL@example.com",
          passwordHash: "REPLACE_WITH_BCRYPT_HASH_OF_ADMIN_PASSWORD",
          pinHash: "REPLACE_WITH_BCRYPT_HASH_OF_ADMIN_6_DIGIT_LOGIN_PIN"
        }, null, 2), 'utf-8');
         return { configured: false, error: "earthpuranadmin.json was not found and has been created with placeholders. Please use the 'Create Admin Account' form or manually configure it." };
      } catch (writeError) {
        console.error("Failed to create placeholder earthpuranadmin.json:", writeError);
        return { configured: false, error: "earthpuranadmin.json not found and could not be created. Please check file permissions." };
      }
    } else if (error instanceof SyntaxError) {
      return { configured: false, error: "earthpuranadmin.json is not valid JSON. Please correct or delete it to re-create." };
    }
    console.error("Failed to read or parse earthpuranadmin.json:", error);
    return { configured: false, error: "Could not read admin credentials. Check server logs." };
  }
}

export async function createEarthPuranAdminAccount(
  email: string,
  plaintextPassword_prototype_only: string,
  plaintextPin_prototype_only: string
): Promise<{ success: boolean; message: string; adminData?: EarthPuranAdminCredentials }> {
  const currentAdminConfig = await getEarthPuranAdminCredentials();
  if (currentAdminConfig.configured) {
    return { success: false, message: "An admin account is already configured. Cannot create another." };
  }

  try {
    const passwordHash = bcrypt.hashSync(plaintextPassword_prototype_only, saltRounds);
    const pinHash = bcrypt.hashSync(plaintextPin_prototype_only, saltRounds);

    const adminData: EarthPuranAdminCredentials = {
      email: email.toLowerCase(),
      passwordHash,
      pinHash,
    };

    await writeEarthPuranAdminFile(adminData);
    revalidatePath('/admin/login'); // Revalidate the admin login page
    return { success: true, message: "Admin account created successfully. Please log in.", adminData };
  } catch (error) {
    console.error("Error creating admin account in earthpuranadmin.json:", error);
    return { success: false, message: "Failed to create admin account. Check server logs." };
  }
}


export async function updateEarthPuranAdminEmail(
  newEmail: string,
  currentPassword_prototype_only: string
): Promise<{ success: boolean; message: string; newEmail?: string }> {
  try {
    const adminData = await readEarthPuranAdminFile();
    if (!adminData.email || !adminData.passwordHash) {
      return { success: false, message: "Admin account not configured. Cannot update email." };
    }

    const isPasswordCorrect = bcrypt.compareSync(currentPassword_prototype_only, adminData.passwordHash);
    if (!isPasswordCorrect) {
      return { success: false, message: "Incorrect current password." };
    }

    const updatedAdminData: EarthPuranAdminCredentials = {
      ...adminData,
      email: newEmail.toLowerCase(),
    };
    await writeEarthPuranAdminFile(updatedAdminData);
    revalidatePath('/admin/settings');
    return { success: true, message: "Admin email updated successfully. Please log in again if this was your current session.", newEmail: newEmail.toLowerCase() };
  } catch (error) {
    console.error("Error updating admin email:", error);
    return { success: false, message: "Failed to update admin email. Check server logs." };
  }
}

export async function updateEarthPuranAdminPassword(
  currentPassword_prototype_only: string,
  newPassword_prototype_only: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminData = await readEarthPuranAdminFile();
    if (!adminData.email || !adminData.passwordHash) {
      return { success: false, message: "Admin account not configured. Cannot update password." };
    }

    const isPasswordCorrect = bcrypt.compareSync(currentPassword_prototype_only, adminData.passwordHash);
    if (!isPasswordCorrect) {
      return { success: false, message: "Incorrect current password." };
    }

    const newPasswordHash = bcrypt.hashSync(newPassword_prototype_only, saltRounds);
    const updatedAdminData: EarthPuranAdminCredentials = {
      ...adminData,
      passwordHash: newPasswordHash,
    };
    await writeEarthPuranAdminFile(updatedAdminData);
    revalidatePath('/admin/settings');
    return { success: true, message: "Admin password updated successfully." };
  } catch (error) {
    console.error("Error updating admin password:", error);
    return { success: false, message: "Failed to update admin password. Check server logs." };
  }
}

export async function updateEarthPuranAdminPin(
  currentPin_prototype_only: string,
  newPin_prototype_only: string
): Promise<{ success: boolean; message: string }> {
  try {
    const adminData = await readEarthPuranAdminFile();
    if (!adminData.email || !adminData.pinHash) {
      return { success: false, message: "Admin account not configured or PIN not set. Cannot update PIN." };
    }

    const isPinCorrect = bcrypt.compareSync(currentPin_prototype_only, adminData.pinHash);
    if (!isPinCorrect) {
      return { success: false, message: "Incorrect current PIN." };
    }

    const newPinHash = bcrypt.hashSync(newPin_prototype_only, saltRounds);
    const updatedAdminData: EarthPuranAdminCredentials = {
      ...adminData,
      pinHash: newPinHash,
    };
    await writeEarthPuranAdminFile(updatedAdminData);
    revalidatePath('/admin/settings');
    return { success: true, message: "Admin login PIN updated successfully." };
  } catch (error) {
    console.error("Error updating admin PIN:", error);
    return { success: false, message: "Failed to update admin PIN. Check server logs." };
  }
}


    