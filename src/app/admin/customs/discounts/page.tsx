
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BadgePercent, Save, Loader2 } from "lucide-react";
import { getGlobalDiscountPercentage, updateGlobalDiscountPercentage } from "@/app/actions/globalDiscountActions";
import { Skeleton } from "@/components/ui/skeleton";


export default function AdminDiscountsPage() {
  const [discountPercentageInput, setDiscountPercentageInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCurrentDiscount = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentDiscountData = await getGlobalDiscountPercentage();
      setDiscountPercentageInput(currentDiscountData.percentage.toString());
    } catch (e) {
      toast({ title: "Error", description: "Could not load current global discount.", variant: "destructive" });
      setDiscountPercentageInput("0"); // Default if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentDiscount();
  }, [fetchCurrentDiscount]);

  const handleSave = async () => {
    const percentage = parseFloat(discountPercentageInput);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid discount percentage between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await updateGlobalDiscountPercentage(percentage);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Global discount percentage updated to ${percentage}%.`,
      });
      if (result.percentage !== undefined) {
        setDiscountPercentageInput(result.percentage.toString());
      }
    } else {
      toast({
        title: "Error Saving Discount",
        description: result.error || "Could not save global discount.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Discounts</h1>
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                <CardContent><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Discounts</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BadgePercent className="mr-2 h-5 w-5" /> Global Discount Configuration
          </CardTitle>
          <CardDescription>
            Set up a store-wide discount percentage. This is saved on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="discountPercentage">Global Discount Percentage (%)</Label>
            <Input
              id="discountPercentage"
              type="number"
              value={discountPercentageInput}
              onChange={(e) => setDiscountPercentageInput(e.target.value)}
              placeholder="e.g., 10 for 10%"
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Discount
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4 bg-muted/30">
        <CardHeader>
            <CardTitle className="text-lg">Discount Application Notes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                This global discount percentage is saved on the server. Currently, it is not automatically applied to product prices or in the cart/checkout.
                Future enhancements could include: product-specific discounts, category-based discounts, "buy one get one" offers, volume discounts, scheduled promotions, and applying this global discount to the cart total.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
