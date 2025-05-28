
"use client";

import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart, type CartItem } from "@/hooks/useCart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();

  const shipping = cartItems.length > 0 ? 50.00 : 0; // Example shipping in INR
  const total = subtotal + shipping;

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    const quantity = Math.max(1, Math.min(newQuantity, item.product.stock)); // Ensure quantity is within bounds
    updateQuantity(item.product.id, quantity);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Shopping Cart</h1>
        {cartItems.length > 0 && (
          <Button variant="outline" onClick={clearCart} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
          </Button>
        )}
      </div>
      {cartItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Your Cart is Empty</h2>
          <p className="mt-2 text-muted-foreground">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <Card key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                <Image 
                  src={item.product.imageUrl} 
                  alt={item.product.name} 
                  width={100} // Increased size
                  height={100} // Increased size
                  className="rounded-md object-cover aspect-square" 
                  data-ai-hint={item.product.imageHint || "product item"} 
                />
                <div className="flex-grow">
                  <Link href={`/products/${item.product.id}`} className="hover:underline">
                    <h3 className="font-semibold text-lg">{item.product.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">₹{item.product.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Category: {item.product.category}</p>
                  {item.quantity > item.product.stock && (
                     <Alert variant="destructive" className="mt-2 text-xs p-2">
                        <AlertDescription>Only {item.product.stock} in stock. Please adjust quantity.</AlertDescription>
                     </Alert>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => handleQuantityChange(item, parseInt(e.target.value))}
                    className="w-16 h-8 text-center"
                    min={1}
                    max={item.product.stock}
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={item.quantity >= item.product.stock}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="font-semibold w-24 text-right mt-2 sm:mt-0">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive mt-2 sm:mt-0" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
          </div>
          <Card className="lg:col-span-1 h-fit sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" className="w-full" disabled={cartItems.length === 0}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
