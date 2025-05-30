
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save, Loader2 } from "lucide-react";
import { getTaxRate, updateTaxRate } from "@/app/actions/taxActions";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTaxesPage() {
  const [taxRateInput, setTaxRateInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCurrentTaxRate = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentRateData = await getTaxRate();
      setTaxRateInput(currentRateData.rate.toString());
    } catch (e) {
      toast({ title: "Error", description: "Could not load current tax rate.", variant: "destructive" });
      setTaxRateInput("18"); // Default to 18 if fetch fails
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentTaxRate();
  }, [fetchCurrentTaxRate]);

  const handleSave = async () => {
    const rate = parseFloat(taxRateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid tax rate between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const result = await updateTaxRate(rate);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `Default tax rate updated to ${rate}%.`,
      });
      if (result.rate !== undefined) {
        setTaxRateInput(result.rate.toString());
      }
    } else {
      toast({
        title: "Error Saving Tax Rate",
        description: result.error || "Could not save tax rate.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Taxes</h1>
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                <CardContent><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Taxes</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Percent className="mr-2 h-5 w-5" /> Tax Configuration
          </CardTitle>
          <CardDescription>
            Define a default tax rate for your products. This rate will be applied to orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              value={taxRateInput}
              onChange={(e) => setTaxRateInput(e.target.value)}
              placeholder="e.g., 18"
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Tax Rate
          </Button>
        </CardContent>
      </Card>
       <Card className="mt-4 bg-muted/30">
        <CardHeader>
            <CardTitle className="text-lg">Tax Application Notes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                The saved tax rate will be used to calculate taxes on the cart and checkout pages. Future enhancements could include tax calculation based on region (GST, VAT), product-specific tax categories, and tax-inclusive/exclusive pricing options.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
