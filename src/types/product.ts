export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string;
  imageHint?: string;
  colors?: string[];
  shades?: string[];
  paletteName?: string;
  color?: string;
  rating?: number;
  reviews?: number;
  stock: number;
  tags?: string[];
}
