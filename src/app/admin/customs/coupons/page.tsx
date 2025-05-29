
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Save, PlusCircle, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const LOCAL_STORAGE_KEY = "earthPuranAdminCoupons";

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  expiryDate?: string; // YYYY-MM-DD
  minSpend?: number;
  usageLimit?: number;
}

export default function AdminCouponsPage() {
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponValue, setCouponValue] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]); // For simplicity, we'll just manage a list of codes here.
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedCoupons = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedCoupons) {
      try {
        setCoupons(JSON.parse(storedCoupons));
      } catch (e) {
        setCoupons([]);
      }
    }
    setIsLoading(false);
  }, []);

  const handleAddCoupon = () => {
    if (!couponCode.trim() || !couponValue.trim()) {
        toast({ title: "Error", description: "Coupon code and value cannot be empty.", variant: "destructive" });
        return;
    }
    const newCoupon: Coupon = { 
        id: Date.now().toString(), 
        code: couponCode.trim().toUpperCase(),
        discountType: 'fixed', // Simplified for prototype
        value: parseFloat(couponValue) || 0,
    };
    const updatedCoupons = [...coupons, newCoupon];
    setCoupons(updatedCoupons);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCoupons));
    toast({ title: "Coupon Added", description: `Coupon "${newCoupon.code}" added.` });
    setCouponCode("");
    setCouponValue("");
  };

  const handleRemoveCoupon = (idToRemove: string) => {
    const updatedCoupons = coupons.filter(coupon => coupon.id !== idToRemove);
    setCoupons(updatedCoupons);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCoupons));
    toast({ title: "Coupon Removed", variant: "destructive" });
  };

  if (isLoading) {
    return <p>Loading coupon settings...</p>;
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
            Create and manage discount coupons for your customers. (Simplified prototype)
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
              />
            </div>
            <Button onClick={handleAddCoupon} className="md:col-span-1">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Coupon
            </Button>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Active Coupons:</h3>
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coupons created yet.</p>
            ) : (
              <ul className="space-y-2">
                {coupons.map((coupon) => (
                  <li key={coupon.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                        <span className="font-semibold">{coupon.code}</span> - 
                        <span className="text-sm text-muted-foreground"> Value: ₹{coupon.value.toFixed(2)}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCoupon(coupon.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
       <Card className="mt-4">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Coupon Features (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: percentage-based discounts, expiry dates, minimum spend requirements, usage limits, applicability to specific products/categories, etc.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
