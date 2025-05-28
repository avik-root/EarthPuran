
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
      setWishlistItems([]); // Reset to empty on error
    }
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    const wasInWishlist = wishlistItems.some(item => item.id === product.id);
    let newItemsState: Product[];

    if (wasInWishlist) {
      newItemsState = wishlistItems.filter(item => item.id !== product.id);
    } else {
      newItemsState = [...wishlistItems, product];
    }

    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save wishlist to localStorage immediately in toggleWishlist", error);
    }
    setWishlistItems(newItemsState);

    setTimeout(() => {
      if (wasInWishlist) {
        toast({
          title: "Removed from Wishlist",
          description: `${product.name} has been removed from your wishlist.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Added to Wishlist",
          description: `${product.name} has been added to your wishlist.`,
        });
      }
    }, 0);
  }, [wishlistItems, toast]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);
  
  const clearWishlist = useCallback(() => {
    const newItemsState: Product[] = [];
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save wishlist to localStorage immediately in clearWishlist", error);
    }
    setWishlistItems(newItemsState);
    
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
