
import type { Product } from './product';
import type { Order } from './order';

// Corresponds to data collected in signup and displayed in profile
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string; // Primary identifier
  countryCode: string; // e.g., "IN"
  phoneNumber: string;
  hashedPassword?: string; 
  hashedPin?: string;    
  isAdmin?: boolean; // Flag for admin status
}

// Corresponds to data managed in AddressManagement and used in checkout
export interface UserAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// CartItem as used by useCart, includes full product details
export interface FullCartItem {
  product: Product;
  quantity: number;
}

// Main structure for a single user's data in users.json
export interface UserData {
  profile: UserProfile;
  addresses: UserAddress[];
  orders: Order[];
  wishlist: Product[]; // Wishlist stores array of Product objects
  cart: FullCartItem[];
}

// Top-level structure for the users.json file (dictionary of UserData)
export interface AllUsersData {
  [email: string]: UserData;
}
