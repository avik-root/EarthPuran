
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useToast } from './use-toast';
import { getUserData, updateUserWishlist } from '@/app/actions/userActions';
import { useRouter } from 'next/navigation'; // Added for potential redirect

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const router = useRouter();

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
      // Already deferred
      setTimeout(() => {
        toast({ title: "Error", description: "Could not load your wishlist.", variant: "destructive" });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, toast]);
  
  useEffect(() => {
    loadWishlistData();
  }, [loadWishlistData]);


  const persistWishlist = useCallback(async (updatedWishlistItems: Product[]) => {
    if (!currentUserEmail) {
      console.warn("Attempted to persist wishlist without a current user email.");
      // Or throw an error to be caught by the caller
      throw new Error("User not logged in. Cannot persist wishlist.");
    }
    try {
      const success = await updateUserWishlist(currentUserEmail, updatedWishlistItems);
      if (!success) {
          // This means the server action itself returned false, not an exception.
          throw new Error("Server action updateUserWishlist returned false.");
      }
    } catch (error) {
      console.error("Failed to persist wishlist:", error);
      setTimeout(() => {
          toast({ title: "Sync Error", description: "Could not save wishlist changes to server.", variant: "destructive" });
      }, 0);
      throw error; // Re-throw to allow the caller (toggleWishlist) to handle it
    }
  }, [currentUserEmail, toast]);

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!currentUserEmail) {
        router.push('/login'); 
        return;
    }
    
    const originalWishlistItems = [...wishlistItems]; // Store current state for potential revert
    const productIsInWishlist = originalWishlistItems.some(item => item.id === product.id);
    let nextWishlistItems: Product[];

    if (productIsInWishlist) {
      nextWishlistItems = originalWishlistItems.filter(item => item.id !== product.id);
    } else {
      nextWishlistItems = [...originalWishlistItems, product];
    }

    // 1. Update local React state immediately
    setWishlistItems(nextWishlistItems);

    // 2. Attempt to persist the change
    try {
      await persistWishlist(nextWishlistItems);
      // 3. Show success toast AFTER successful persistence
      setTimeout(() => {
        if (productIsInWishlist) { // Refers to state *before* toggle
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
    } catch (error) {
      // 4. If persistence failed, revert local state
      console.error("Wishlist persistence failed, reverting local state.");
      setWishlistItems(originalWishlistItems);
      // Error toast is handled by persistWishlist
    }
  }, [currentUserEmail, wishlistItems, persistWishlist, toast, router]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);
  
  const clearWishlist = useCallback(async () => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }
    
    const originalWishlistItems = [...wishlistItems];
    const newComputedItems: Product[] = [];
    
    setWishlistItems(newComputedItems); 
    
    try {
        await persistWishlist(newComputedItems);
        setTimeout(() => {
        toast({
            title: "Wishlist Cleared",
            description: "All items have been removed from your wishlist.",
        });
        }, 0);
    } catch (error) {
        console.error("Failed to clear wishlist on server, reverting local state.");
        setWishlistItems(originalWishlistItems);
        // Error toast handled by persistWishlist
    }
  }, [currentUserEmail, persistWishlist, toast, router, wishlistItems]);

  return {
    wishlistItems,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoadingWishlist: isLoading,
    refreshWishlist: loadWishlistData,
  };
}
