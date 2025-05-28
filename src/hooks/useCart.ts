
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
      // Optionally clear corrupted storage
      // localStorage.removeItem(CART_STORAGE_KEY); 
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } // Respect stock
            : item
        );
      }
      return [...prevItems, { product, quantity: Math.min(quantity, product.stock) }];
    });
    setTimeout(() => {
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }, 0);
  }, [toast]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    setTimeout(() => {
      toast({
        title: "Item Removed",
        description: "The item has been removed from your cart.",
        variant: "destructive"
      });
    }, 0);
  }, [toast]);

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.product.id === productId) {
          // Ensure quantity is at least 1 and not more than stock
          const validatedQuantity = Math.max(1, Math.min(newQuantity, item.product.stock));
          return { ...item, quantity: validatedQuantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
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
