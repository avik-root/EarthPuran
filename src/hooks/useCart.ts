
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types/product';
import type { FullCartItem } from '@/types/userData';
import { useToast } from './use-toast';
import { 
    getUserData, 
    addItemToUserCartAction,
    removeItemFromUserCartAction,
    updateUserItemQuantityInCartAction,
    clearUserCartAction
} from '@/app/actions/userActions';
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

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const existingItemIndex = originalCartItems.findIndex(item => item.product.id === product.id);
    let nextCartItemsOptimistic: FullCartItem[];
    const itemWasAlreadyInCart = existingItemIndex > -1;
    const oldQuantityOfItemInCart = itemWasAlreadyInCart ? originalCartItems[existingItemIndex].quantity : 0;

    if (itemWasAlreadyInCart) {
      nextCartItemsOptimistic = originalCartItems.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item
      );
    } else {
      nextCartItemsOptimistic = [...originalCartItems, { product, quantity: Math.min(quantity, product.stock) }];
    }
    
    setCartItems(nextCartItemsOptimistic); // Optimistic update

    try {
      const serverResponse = await addItemToUserCartAction(currentUserEmail, product, quantity);
      if (serverResponse.success && serverResponse.cart) {
        setCartItems(serverResponse.cart); // Sync with server's authoritative state

        const finalQuantityInCart = serverResponse.cart.find(ci => ci.product.id === product.id)?.quantity || 0;
        let toastDescription = "";

        if (itemWasAlreadyInCart && oldQuantityOfItemInCart !== finalQuantityInCart) {
            toastDescription = `${product.name} quantity updated to ${finalQuantityInCart}.`;
        } else if (!itemWasAlreadyInCart && finalQuantityInCart > 0) {
            toastDescription = `${finalQuantityInCart} x ${product.name} added to cart.`;
        } else if (itemWasAlreadyInCart && oldQuantityOfItemInCart === finalQuantityInCart && quantity > 0) {
            // This case can happen if user tries to add more than stock, but quantity didn't change
            toastDescription = `${product.name} is already at max stock (${product.stock}).`;
        } else {
            // Fallback or no change
            toastDescription = `${product.name} cart status checked.`;
        }
        
        const quantityRequested = quantity;
        const quantityActuallyAddedOrNewTotal = finalQuantityInCart; 
        
        if (itemWasAlreadyInCart) {
            const quantityChangeAttempted = quantity;
            const actualQuantityChange = finalQuantityInCart - oldQuantityOfItemInCart;
             if (quantityChangeAttempted > actualQuantityChange && finalQuantityInCart === product.stock) {
                 toastDescription += ` (Limited by stock: ${product.stock} available). Requested additional ${quantityChangeAttempted}, ${actualQuantityChange > 0 ? `added ${actualQuantityChange}`: 'no change'}.`;
             }
        } else { // New item
            if (quantityRequested > finalQuantityInCart && finalQuantityInCart === product.stock) {
                toastDescription += ` (Limited by stock: ${product.stock} available). Requested ${quantityRequested}, added ${finalQuantityInCart}.`;
            }
        }
        
        if(toastDescription) { // Only show toast if there's something to say
            setTimeout(() => { 
                toast({
                    title: "Cart Updated",
                    description: toastDescription,
                });
            },0);
        }
      } else {
        throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to update cart or returned unexpected data.");
      }
    } catch (error) {
      console.error("Add to cart persistence failed, reverting local state.", error);
      setCartItems(originalCartItems); // Revert optimistic update
      setTimeout(() => {
        toast({ title: "Cart Error", description: `Could not add ${product.name} to cart. Please try again.`, variant: "destructive" });
      },0);
    }
  }, [currentUserEmail, cartItems, toast, router]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const productToRemove = originalCartItems.find(item => item.product.id === productId)?.product;
    const nextCartItemsOptimistic = originalCartItems.filter(item => item.product.id !== productId);
    
    setCartItems(nextCartItemsOptimistic); // Optimistic update
    
    if (productToRemove) {
      try {
        const serverResponse = await removeItemFromUserCartAction(currentUserEmail, productId);
        if (serverResponse.success && serverResponse.cart) {
          setCartItems(serverResponse.cart); // Sync with server
          setTimeout(() => {
            toast({
                title: "Item Removed",
                description: `${productToRemove.name} has been removed from your cart.`,
                variant: "destructive"
            });
          }, 0);
        } else {
          throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to remove item or returned unexpected data.");
        }
      } catch (error) {
        console.error("Remove from cart persistence failed, reverting local state.", error);
        setCartItems(originalCartItems); // Revert
         setTimeout(() => {
            toast({ title: "Cart Error", description: `Could not remove ${productToRemove.name} from cart.`, variant: "destructive" });
        },0);
      }
    }
  }, [currentUserEmail, cartItems, toast, router]);

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    const itemToUpdate = originalCartItems.find(item => item.product.id === productId);
    if (!itemToUpdate) return;

    const validatedQuantity = Math.max(0, Math.min(newQuantity, itemToUpdate.product.stock)); // Allow 0 to remove
    
    let nextCartItemsOptimistic: FullCartItem[];
    if (validatedQuantity === 0) {
        nextCartItemsOptimistic = originalCartItems.filter(item => item.product.id !== productId);
    } else {
        nextCartItemsOptimistic = originalCartItems.map(item => 
            item.product.id === productId 
            ? { ...item, quantity: validatedQuantity } 
            : item
        );
    }
    setCartItems(nextCartItemsOptimistic); // Optimistic update

    try {
      const serverResponse = await updateUserItemQuantityInCartAction(currentUserEmail, productId, validatedQuantity);
      if (serverResponse.success && serverResponse.cart) {
        setCartItems(serverResponse.cart); // Sync with server
        // Optionally, a toast for quantity update, but can be noisy.
        // Let's skip toast for simple quantity updates unless it results in removal or a significant change.
      } else {
        throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to update quantity or returned unexpected data.");
      }
    } catch (error) {
      console.error("Update quantity persistence failed, reverting local state.", error);
      setCartItems(originalCartItems); // Revert
       setTimeout(() => {
        toast({ title: "Cart Error", description: "Could not update item quantity.", variant: "destructive" });
      },0);
    }
  }, [currentUserEmail, cartItems, toast, router]);

  const clearCart = useCallback(async () => {
    if (!currentUserEmail) {
        router.push('/login');
        return;
    }

    const originalCartItems = [...cartItems];
    setCartItems([]); // Optimistic update
    
    try {
      const serverResponse = await clearUserCartAction(currentUserEmail);
      if (serverResponse.success && serverResponse.cart !== undefined) {
        setCartItems(serverResponse.cart); // Sync, should be []
        setTimeout(() => {
          toast({
            title: "Cart Cleared",
            description: "All items have been removed from your cart.",
          });
        }, 0);
      } else {
        throw new Error(serverResponse.success === false ? "Server action indicated failure." : "Server action failed to clear cart or returned unexpected data.");
      }
    } catch (error) {
      console.error("Clear cart persistence failed, reverting local state.", error);
      setCartItems(originalCartItems); // Revert
      setTimeout(() => {
        toast({ title: "Cart Error", description: "Could not clear your cart.", variant: "destructive" });
      },0);
    }
  }, [currentUserEmail, cartItems, toast, router]);

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
