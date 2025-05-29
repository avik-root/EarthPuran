
export interface Review {
  id: string;
  userEmail: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO string or formatted date string
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string; // Primary image URL
  imageHint?: string;
  additionalImageUrls?: string[]; // Array of additional image URLs
  colors?: string[];
  shades?: string[];
  paletteName?: string;
  color?: string;
  rating?: number; // Average rating
  reviews?: number; // Total number of reviews (count)
  productReviews?: Review[]; // Array of actual review objects
  stock: number;
  tags?: string[];
}
