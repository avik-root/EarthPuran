
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import type { FullCartItem } from '@/types/userData';
import { useToast } from './use-toast';
import { getUserData, updateUserCart } from '@/app/actions/userActions';

export function useCart() {
  const [cartItems, setCartItems] = useState<FullCartItem[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentUserEmail');
      setCurrentUserEmail(email);
    }
  }, []);


  const loadCartData = useCallback(async () => {
    if (!currentUserEmail) {
      setCartItems([]); // No user, clear cart
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
      toast({ title: "Error", description: "Could not load your cart.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, toast]);

  useEffect(() => {
    loadCartData();
  }, [loadCartData]);

  const persistCart = useCallback(async (updatedCartItems: FullCartItem[]) => {
    if (currentUserEmail) {
      try {
        await updateUserCart(currentUserEmail, updatedCartItems);
      } catch (error) {
        console.error("Failed to persist cart:", error);
        toast({ title: "Sync Error", description: "Could not save cart changes to server.", variant: "destructive" });
      }
    }
  }, [currentUserEmail, toast]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (!currentUserEmail) {
        toast({title: "Login Required", description: "Please log in to add items to your cart.", variant: "destructive"});
        return;
    }

    setCartItems(prevCartItems => {
      const existingItemIndex = prevCartItems.findIndex(item => item.product.id === product.id);
      let newComputedCart: FullCartItem[];

      if (existingItemIndex > -1) {
        newComputedCart = prevCartItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      } else {
        newComputedCart = [...prevCartItems, { product, quantity: Math.min(quantity, product.stock) }];
      }
      persistCart(newComputedCart); // Persist the newly computed state
      return newComputedCart; // Update React state
    });

    setTimeout(() => { 
        toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
        });
    },0);
  }, [currentUserEmail, persistCart, toast]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!currentUserEmail) return; 

    const productToRemove = cartItems.find(item => item.product.id === productId)?.product;
    
    setCartItems(prevCartItems => {
        const newComputedCart = prevCartItems.filter(item => item.product.id !== productId);
        persistCart(newComputedCart);
        return newComputedCart;
    });

    if (productToRemove) {
      setTimeout(() => {
        toast({
            title: "Item Removed",
            description: `${productToRemove.name} has been removed from your cart.`,
            variant: "destructive"
        });
      }, 0);
    }
  }, [cartItems, currentUserEmail, persistCart, toast]); // cartItems needed for finding productToRemove for toast

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!currentUserEmail) return;

    setCartItems(prevCartItems => {
        const newComputedCart = prevCartItems.map(item => {
            if (item.product.id === productId) {
                const validatedQuantity = Math.max(1, Math.min(newQuantity, item.product.stock));
                return { ...item, quantity: validatedQuantity };
            }
            return item;
        });
        persistCart(newComputedCart);
        return newComputedCart;
    });
  }, [currentUserEmail, persistCart]);

  const clearCart = useCallback(async () => {
    if (!currentUserEmail) return;

    setCartItems(prevCartItems => {
        const newComputedCart: FullCartItem[] = [];
        persistCart(newComputedCart);
        return newComputedCart;
    });

    setTimeout(() => {
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    }, 0);
  }, [currentUserEmail, persistCart, toast]);

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
