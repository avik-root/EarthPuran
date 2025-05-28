
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useToast } from './use-toast';

const WISHLIST_STORAGE_KEY = 'earthPuranWishlist';

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load wishlist from localStorage on initial client-side render
    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        setWishlistItems(JSON.parse(storedWishlist));
      }
    } catch (error) {
      console.error("Failed to load wishlist from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Save wishlist to localStorage whenever it changes
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (error) {
      console.error("Failed to save wishlist to localStorage", error);
    }
  }, [wishlistItems]);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlistItems(prevItems => {
      const isInWishlist = prevItems.some(item => item.id === product.id);
      if (isInWishlist) {
        setTimeout(() => {
          toast({
            title: "Removed from Wishlist",
            description: `${product.name} has been removed from your wishlist.`,
            variant: "destructive"
          });
        }, 0);
        return prevItems.filter(item => item.id !== product.id);
      } else {
        setTimeout(() => {
          toast({
            title: "Added to Wishlist",
            description: `${product.name} has been added to your wishlist.`,
          });
        }, 0);
        return [...prevItems, product];
      }
    });
  }, [toast]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);
  
  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    setTimeout(() => {
     toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    });
    }, 0);
  }, [toast]);

  return {
    wishlistItems,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
  };
}
