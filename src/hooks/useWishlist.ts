
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useToast } from './use-toast';
import { 
    getUserData, 
    addProductToWishlistAction, 
    removeProductFromWishlistAction, 
    clearUserWishlistAction 
} from '@/app/actions/userActions';
import { useRouter } from 'next/navigation';

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

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalWishlistItems = [...wishlistItems];
    const productIsInWishlist = originalWishlistItems.some(item => item.id === product.id);
    
    // Optimistic update
    if (productIsInWishlist) {
        setWishlistItems(prevItems => prevItems.filter(item => item.id !== product.id));
    } else {
        setWishlistItems(prevItems => [...prevItems, product]);
    }

    try {
        let serverResponse;
        if (productIsInWishlist) {
            serverResponse = await removeProductFromWishlistAction(currentUserEmail, product.id);
        } else {
            serverResponse = await addProductToWishlistAction(currentUserEmail, product);
        }

        if (serverResponse.success && serverResponse.wishlist) {
            setWishlistItems(serverResponse.wishlist); // Sync with server's authoritative state
            setTimeout(() => {
                toast({
                    title: productIsInWishlist ? "Removed from Wishlist" : "Added to Wishlist",
                    description: `${product.name} has been ${productIsInWishlist ? 'removed from' : 'added to'} your wishlist.`,
                    variant: productIsInWishlist ? "destructive" : "default",
                });
            }, 0);
        } else {
            throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to update wishlist or returned unexpected data.");
        }
    } catch (error) {
        console.error("Wishlist toggle persistence failed, reverting local state.", error);
        setWishlistItems(originalWishlistItems); // Revert optimistic update
        setTimeout(() => {
            toast({ title: "Wishlist Error", description: "Could not update your wishlist. Please try again.", variant: "destructive" });
        }, 0);
    }
  }, [currentUserEmail, wishlistItems, toast, router]);

  const isInWishlist = useCallback((productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  }, [wishlistItems]);
  
  const clearWishlist = useCallback(async () => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }
    
    const originalWishlistItems = [...wishlistItems];
    setWishlistItems([]); // Optimistic update
    
    try {
        const serverResponse = await clearUserWishlistAction(currentUserEmail);
        if (serverResponse.success && serverResponse.wishlist !== undefined) {
            setWishlistItems(serverResponse.wishlist); // Sync with server, should be []
            setTimeout(() => {
                toast({
                    title: "Wishlist Cleared",
                    description: "All items have been removed from your wishlist.",
                });
            }, 0);
        } else {
            throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to clear wishlist or returned unexpected data.");
        }
    } catch (error) {
        console.error("Failed to clear wishlist on server, reverting local state.", error);
        setWishlistItems(originalWishlistItems); // Revert
        setTimeout(() => {
            toast({ title: "Error Clearing Wishlist", description: "Could not clear your wishlist.", variant: "destructive" });
        }, 0);
    }
  }, [currentUserEmail, wishlistItems, toast, router]);

  return {
    wishlistItems,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoadingWishlist: isLoading,
    refreshWishlist: loadWishlistData,
  };
}
