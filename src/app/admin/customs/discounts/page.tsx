
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BadgePercent, Save } from "lucide-react";

// Each customs option uses its own dedicated key in localStorage,
// acting as a separate client-side "database" for its settings.
const GLOBAL_DISCOUNT_STORAGE_KEY = "earthPuranAdminGlobalDiscount";

export default function AdminDiscountsPage() {
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedDiscount = localStorage.getItem(GLOBAL_DISCOUNT_STORAGE_KEY);
    if (storedDiscount) {
      setDiscountPercentage(storedDiscount);
    } else {
      setDiscountPercentage("0"); // Default to 0% discount
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    const percentage = parseFloat(discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid discount percentage between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem(GLOBAL_DISCOUNT_STORAGE_KEY, discountPercentage);
    toast({
      title: "Settings Saved",
      description: `Global discount percentage updated to ${discountPercentage}%.`,
    });
  };

  if (isLoading) {
    return <p>Loading discount settings...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Discounts</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BadgePercent className="mr-2 h-5 w-5" /> Discount Configuration
          </CardTitle>
          <CardDescription>
            Set up a global discount percentage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="discountPercentage">Global Discount Percentage (%)</Label>
            <Input
              id="discountPercentage"
              type="number"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              placeholder="e.g., 10 for 10%"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Discount
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Discount Rules (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: product-specific discounts, category-based discounts, "buy one get one" offers, volume discounts, scheduled promotions, etc. Actual application of discounts in cart/checkout is not implemented.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
