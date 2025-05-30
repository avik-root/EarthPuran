
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Save, PlusCircle, Trash2, Loader2 } from "lucide-react";
import type { Coupon } from "@/types/coupon";
import { getCoupons, addCoupon, deleteCoupon } from "@/app/actions/couponActions";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCouponsPage() {
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponValue, setCouponValue] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCouponsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCoupons = await getCoupons();
      setCoupons(fetchedCoupons);
    } catch (e) {
      toast({ title: "Error", description: "Could not load coupons.", variant: "destructive" });
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCouponsData();
  }, [fetchCouponsData]);

  const handleAddCoupon = async () => {
    if (!couponCode.trim() || !couponValue.trim()) {
        toast({ title: "Error", description: "Coupon code and value cannot be empty.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const newCouponData: Omit<Coupon, 'id'> = { 
        code: couponCode.trim(),
        discountType: 'fixed', // Simplified for prototype
        value: parseFloat(couponValue) || 0,
    };

    const result = await addCoupon(newCouponData);
    if (result.success && result.coupon) {
      setCoupons(prev => [...prev, result.coupon!].sort((a,b) => a.code.localeCompare(b.code)));
      toast({ title: "Coupon Added", description: `Coupon "${result.coupon.code}" added successfully.` });
      setCouponCode("");
      setCouponValue("");
    } else {
      toast({ title: "Error Adding Coupon", description: result.error || "Could not add coupon.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleRemoveCoupon = async (idToRemove: string) => {
    const couponToRemove = coupons.find(coupon => coupon.id === idToRemove);
    if (!couponToRemove) return;

    setIsSubmitting(true); // Consider a different loading state per item if needed
    const result = await deleteCoupon(idToRemove);
    if (result.success) {
      setCoupons(prev => prev.filter(coupon => coupon.id !== idToRemove));
      toast({ title: "Coupon Removed", description: `Coupon "${couponToRemove.code}" removed.`, variant: "destructive" });
    } else {
      toast({ title: "Error Removing Coupon", description: result.error || "Could not remove coupon.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Coupons</h1>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2"/><Skeleton className="h-4 w-3/4 mt-2"/></CardHeader>
          <CardContent><Skeleton className="h-24 w-full"/></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Coupons</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="mr-2 h-5 w-5" /> Coupon Management
          </CardTitle>
          <CardDescription>
            Create and manage discount coupons for your customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label htmlFor="couponCode">New Coupon Code</Label>
              <Input
                id="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g., SUMMER20"
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="couponValue">Value (₹)</Label>
              <Input
                id="couponValue"
                type="number"
                value={couponValue}
                onChange={(e) => setCouponValue(e.target.value)}
                placeholder="e.g., 100"
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <Button onClick={handleAddCoupon} className="md:col-span-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Add Coupon
            </Button>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Active Coupons:</h3>
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coupons created yet.</p>
            ) : (
              <ul className="space-y-2">
                {coupons.map((coupon) => (
                  <li key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg shadow-sm">
                    <div>
                        <span className="font-semibold text-primary">{coupon.code}</span> - 
                        <span className="text-sm text-muted-foreground"> Value: ₹{coupon.value.toFixed(2)}</span>
                         {/* Add more details like expiry, minSpend if needed */}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveCoupon(coupon.id)} 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isSubmitting}
                      aria-label={`Remove coupon ${coupon.code}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
       <Card className="mt-4 bg-muted/30">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Coupon Features (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: percentage-based discounts, expiry dates, minimum spend requirements, usage limits per user or globally, applicability to specific products/categories, etc.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
