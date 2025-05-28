
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useToast } from './use-toast';
import { getUserData, updateUserWishlist } from '@/app/actions/userActions';

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

 useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentUserEmail');
      setCurrentUserEmail(email);
    }
  }, []);

  const loadWishlistData = useCallback(async () => {
    if (!currentUserEmail) {
      setWishlistItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userData = await getUserData(currentUserEmail);
      setWishlistItems(userData?.wishlist || []);
    } catch (error) {
      console.error("Failed to load wishlist data:", error);
      setWishlistItems([]);
      toast({ title: "Error", description: "Could not load your wishlist.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, toast]);
  
  useEffect(() => {
    loadWishlistData();
  }, [loadWishlistData]);


  const persistWishlist = async (updatedWishlistItems: Product[]) => {
    if (currentUserEmail) {
       try {
        await updateUserWishlist(currentUserEmail, updatedWishlistItems);
      } catch (error) {
        console.error("Failed to persist wishlist:", error);
        toast({ title: "Sync Error", description: "Could not save wishlist changes to server.", variant: "destructive" });
      }
    }
  };

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!currentUserEmail) {
        toast({title: "Login Required", description: "Please log in to manage your wishlist.", variant: "destructive"});
        return;
    }
    const wasInWishlist = wishlistItems.some(item => item.id === product.id);
    let newItemsState: Product[];

    if (wasInWishlist) {
      newItemsState = wishlistItems.filter(item => item.id !== product.id);
    } else {
      newItemsState = [...wishlistItems, product];
    }

    setWishlistItems(newItemsState); 
    await persistWishlist(newItemsState);

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
    },0);
  }, [wishlistItems, toast, currentUserEmail]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);
  
  const clearWishlist = useCallback(async () => {
    if (!currentUserEmail) return;
    const newItemsState: Product[] = [];
    setWishlistItems(newItemsState);
    await persistWishlist(newItemsState);
    
    setTimeout(() => {
     toast({
      title: "Wishlist Cleared",
      description: "All items have been removed from your wishlist.",
    });
    }, 0);
  }, [toast, currentUserEmail]);

  return {
    wishlistItems,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoadingWishlist: isLoading,
    refreshWishlist: loadWishlistData,
  };
}
