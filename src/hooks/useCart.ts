
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import { useToast } from './use-toast';

export interface CartItem {
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = 'earthPuranCart';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load cart from localStorage on initial client-side render
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
      setCartItems([]); // Reset to empty on error
    }
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    let newItemsState: CartItem[];
    const existingItem = cartItems.find(item => item.product.id === product.id);
    if (existingItem) {
      newItemsState = cartItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } // Respect stock
          : item
      );
    } else {
      newItemsState = [...cartItems, { product, quantity: Math.min(quantity, product.stock) }];
    }

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save cart to localStorage immediately in addToCart", error);
    }
    setCartItems(newItemsState);

    setTimeout(() => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }, 0);
  }, [cartItems, toast]);

  const removeFromCart = useCallback((productId: string) => {
    const productToRemove = cartItems.find(item => item.product.id === productId)?.product;
    const newItemsState = cartItems.filter(item => item.product.id !== productId);

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save cart to localStorage immediately in removeFromCart", error);
    }
    setCartItems(newItemsState);

    if (productToRemove) {
      setTimeout(() => {
        toast({
          title: "Item Removed",
          description: `${productToRemove.name} has been removed from your cart.`,
          variant: "destructive"
        });
      }, 0);
    }
  }, [cartItems, toast]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    const newItemsState = cartItems.map(item => {
      if (item.product.id === productId) {
        // Ensure quantity is at least 1 and not more than stock
        const validatedQuantity = Math.max(1, Math.min(newQuantity, item.product.stock));
        return { ...item, quantity: validatedQuantity };
      }
      return item;
    });

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save cart to localStorage immediately in updateQuantity", error);
    }
    setCartItems(newItemsState);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    const newItemsState: CartItem[] = [];
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItemsState));
    } catch (error) {
      console.error("Failed to save cart to localStorage immediately in clearCart", error);
    }
    setCartItems(newItemsState);

    setTimeout(() => {
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    }, 0);
  }, [toast]);

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
  };
}
