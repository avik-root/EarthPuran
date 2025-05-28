
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import type { FullCartItem } from '@/types/userData';
import { useToast } from './use-toast';
import { getUserData, updateUserCart } from '@/app/actions/userActions';
import { useRouter } from 'next/navigation';

export function useCart() {
  const [cartItems, setCartItems] = useState<FullCartItem[]>([]);
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


  const loadCartData = useCallback(async () => {
    if (!currentUserEmail) {
      setCartItems([]); 
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userData = await getUserData(currentUserEmail);
      setCartItems(userData?.cart || []);
    } catch (error) {
      console.error("Failed to load cart data:", error);
      setCartItems([]);
      setTimeout(() => {
        toast({ title: "Error", description: "Could not load your cart.", variant: "destructive" });
      }, 0);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, toast]);

  useEffect(() => {
    loadCartData();
  }, [loadCartData]);

  const persistCart = useCallback(async (updatedCartItems: FullCartItem[]) => {
    if (!currentUserEmail) {
      console.warn("Attempted to persist cart without a current user email.");
      throw new Error("User not logged in. Cannot persist cart.");
    }
    try {
      const success = await updateUserCart(currentUserEmail, updatedCartItems);
      if (!success) {
        throw new Error("Server action updateUserCart returned false.");
      }
    } catch (error) {
      console.error("Failed to persist cart:", error);
      setTimeout(() => {
          toast({ title: "Sync Error", description: "Could not save cart changes to server.", variant: "destructive" });
      }, 0);
      throw error; 
    }
  }, [currentUserEmail, toast]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const existingItemIndex = originalCartItems.findIndex(item => item.product.id === product.id);
    let nextCartItems: FullCartItem[];
    const itemWasAlreadyInCart = existingItemIndex > -1;
    const oldQuantityOfItemInCart = itemWasAlreadyInCart ? originalCartItems[existingItemIndex].quantity : 0;

    if (itemWasAlreadyInCart) {
      nextCartItems = originalCartItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item
      );
    } else {
      nextCartItems = [...originalCartItems, { product, quantity: Math.min(quantity, product.stock) }];
    }
    
    setCartItems(nextCartItems);

    try {
      await persistCart(nextCartItems);
      
      const finalQuantityInCart = nextCartItems.find(ci => ci.product.id === product.id)?.quantity || 0;
      let toastDescription = "";

      if (itemWasAlreadyInCart) {
        toastDescription = `${product.name} quantity updated to ${finalQuantityInCart}.`;
      } else {
        toastDescription = `${finalQuantityInCart} x ${product.name} added to cart.`;
      }
      
      const quantityActuallyAdded = finalQuantityInCart - oldQuantityOfItemInCart;
      if (quantity > quantityActuallyAdded && finalQuantityInCart === product.stock) {
         toastDescription += ` (Limited by stock: ${product.stock} available). Requested ${quantity}, added ${quantityActuallyAdded}.`;
      }


      setTimeout(() => { 
          toast({
              title: "Cart Updated",
              description: toastDescription,
          });
      },0);
    } catch (error) {
      console.error("Add to cart persistence failed, reverting local state.");
      setCartItems(originalCartItems);
    }
  }, [currentUserEmail, cartItems, persistCart, toast, router]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const productToRemove = originalCartItems.find(item => item.product.id === productId)?.product;
    const nextCartItems = originalCartItems.filter(item => item.product.id !== productId);
    
    setCartItems(nextCartItems);
    
    if (productToRemove) {
      try {
        await persistCart(nextCartItems);
        setTimeout(() => {
          toast({
              title: "Item Removed",
              description: `${productToRemove.name} has been removed from your cart.`,
              variant: "destructive"
          });
        }, 0);
      } catch (error) {
        console.error("Remove from cart persistence failed, reverting local state.");
        setCartItems(originalCartItems);
      }
    }
  }, [currentUserEmail, cartItems, persistCart, toast, router]);

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const nextCartItems = originalCartItems.map(item => {
        if (item.product.id === productId) {
            const validatedQuantity = Math.max(1, Math.min(newQuantity, item.product.stock));
            return { ...item, quantity: validatedQuantity };
        }
        return item;
    }).filter(item => item.quantity > 0); 

    setCartItems(nextCartItems);

    try {
      await persistCart(nextCartItems);
    } catch (error) {
      console.error("Update quantity persistence failed, reverting local state.");
      setCartItems(originalCartItems);
    }
  }, [currentUserEmail, cartItems, persistCart, router]);

  const clearCart = useCallback(async () => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const nextCartItems: FullCartItem[] = [];
    
    setCartItems(nextCartItems); 
    
    try {
      await persistCart(nextCartItems);
      setTimeout(() => {
        toast({
          title: "Cart Cleared",
          description: "All items have been removed from your cart.",
        });
      }, 0);
    } catch (error) {
      console.error("Clear cart persistence failed, reverting local state.");
      setCartItems(originalCartItems);
    }
  }, [currentUserEmail, cartItems, persistCart, toast, router]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    isLoadingCart: isLoading,
    refreshCart: loadCartData,
  };
}
