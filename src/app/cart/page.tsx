
"use client";

import { ShoppingCart, Trash2, Minus, Plus, Ticket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart, type CartItem } from "@/hooks/useCart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/types/coupon";
import { getCoupons } from "@/app/actions/couponActions";
import { getTaxRate } from "@/app/actions/taxActions"; // Import new tax action

const DEFAULT_TAX_RATE_PERCENTAGE = 18; // Fallback default

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const { toast } = useToast();

  const [couponCodeInput, setCouponCodeInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [taxRatePercentage, setTaxRatePercentage] = useState<number>(DEFAULT_TAX_RATE_PERCENTAGE);
  const [isLoadingTaxRate, setIsLoadingTaxRate] = useState(true);

  const fetchAvailableCoupons = useCallback(async () => {
    setIsLoadingCoupons(true);
    try {
      const fetchedCoupons = await getCoupons();
      setAvailableCoupons(fetchedCoupons);
    } catch (e) {
      console.error("Failed to fetch coupons from server", e);
      setAvailableCoupons([]);
      toast({ title: "Coupon Error", description: "Could not load available coupons.", variant: "destructive" });
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [toast]);

  const fetchCurrentTaxRate = useCallback(async () => {
    setIsLoadingTaxRate(true);
    try {
        const taxData = await getTaxRate();
        setTaxRatePercentage(taxData.rate);
    } catch (error) {
        console.error("Failed to fetch tax rate:", error);
        setTaxRatePercentage(DEFAULT_TAX_RATE_PERCENTAGE); // Fallback
        toast({ title: "Tax Rate Error", description: "Could not load tax rate, using default.", variant: "destructive" });
    } finally {
        setIsLoadingTaxRate(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAvailableCoupons();
    fetchCurrentTaxRate();
  }, [fetchAvailableCoupons, fetchCurrentTaxRate]);

  const handleApplyCoupon = async () => {
    setCouponMessage(null);
    if (!couponCodeInput.trim()) {
      setCouponMessage({ text: "Please enter a coupon code.", type: 'error' });
      return;
    }
    setIsApplyingCoupon(true);
    
    if (availableCoupons.length === 0 && !isLoadingCoupons) {
        await fetchAvailableCoupons(); 
    }
    
    const matchedCoupon = availableCoupons.find(
      (coupon) => coupon.code.toUpperCase() === couponCodeInput.trim().toUpperCase()
    );

    if (matchedCoupon) {
      if (matchedCoupon.discountType === 'fixed') {
        setAppliedCoupon(matchedCoupon);
        setCouponMessage({ text: `Coupon "${matchedCoupon.code}" applied! You save ₹${matchedCoupon.value.toFixed(2)}.`, type: 'success' });
        toast({ title: "Coupon Applied", description: `Discount of ₹${matchedCoupon.value.toFixed(2)} applied.` });
      } else {
        setCouponMessage({ text: `Coupon "${matchedCoupon.code}" is not a fixed discount type (not yet supported).`, type: 'error' });
        setAppliedCoupon(null);
        toast({ title: "Coupon Error", description: "This coupon type is not yet supported.", variant: "destructive" });
      }
    } else {
      setAppliedCoupon(null);
      setCouponMessage({ text: "Invalid or expired coupon code.", type: 'error' });
      toast({ title: "Invalid Coupon", description: "The entered coupon code is not valid.", variant: "destructive" });
    }
    setCouponCodeInput("");
    setIsApplyingCoupon(false);
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage({ text: "Coupon removed.", type: 'error' }); // Using error type for red text consistency
    toast({ title: "Coupon Removed" });
  };

  const shipping = cartItems.length > 0 ? 50.00 : 0; 
  const discountAmount = appliedCoupon && appliedCoupon.discountType === 'fixed' ? appliedCoupon.value : 0;
  
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = cartItems.length > 0 && !isLoadingTaxRate ? subtotalAfterDiscount * (taxRatePercentage / 100) : 0;
  
  let calculatedTotal = subtotalAfterDiscount + taxAmount + shipping;
  if (calculatedTotal < 0) calculatedTotal = 0;


  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    const quantity = Math.max(1, Math.min(newQuantity, item.product.stock)); 
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
                  width={100}
                  height={100}
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
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="flex-grow"
                  disabled={!!appliedCoupon || isApplyingCoupon || isLoadingCoupons}
                />
                {!appliedCoupon ? (
                    <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || isLoadingCoupons}>
                        {isApplyingCoupon || isLoadingCoupons ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Ticket className="mr-2 h-4 w-4" />}
                        Apply
                    </Button>
                ) : (
                    <Button variant="outline" onClick={removeAppliedCoupon} className="text-destructive hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Remove
                    </Button>
                )}
              </div>
              {couponMessage && (
                <p className={cn("text-xs", couponMessage.type === 'success' ? 'text-green-600' : 'text-destructive')}>
                  {couponMessage.text}
                </p>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount <span className="text-xs">({appliedCoupon?.code})</span></span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {subtotalAfterDiscount !== subtotal && (
                <div className="flex justify-between text-sm font-medium">
                  <span>Subtotal (after discount)</span>
                  <span>₹{subtotalAfterDiscount.toFixed(2)}</span>
                </div>
              )}
               <div className="flex justify-between text-sm">
                <span>Tax ({isLoadingTaxRate ? '...' : taxRatePercentage}%)</span>
                <span>+ ₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>+ ₹{shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{calculatedTotal.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild size="lg" className="w-full" disabled={isLoadingTaxRate || cartItems.length === 0 || cartItems.some(item => item.quantity > item.product.stock)}>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </CardFooter>
            {cartItems.some(item => item.quantity > item.product.stock) && (
                <p className="text-xs text-destructive text-center p-2">
                    Please resolve stock issues before proceeding.
                </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
