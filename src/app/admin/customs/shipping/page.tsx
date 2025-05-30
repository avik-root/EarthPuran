
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Save, Loader2 } from "lucide-react";
import { getShippingSettings, updateShippingSettings } from "@/app/actions/shippingActions";
import type { ShippingSettings } from "@/types/shipping";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminShippingChargesPage() {
  const [shippingRateInput, setShippingRateInput] = useState<string>("");
  const [freeShippingThresholdInput, setFreeShippingThresholdInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchCurrentSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentSettings = await getShippingSettings();
      setShippingRateInput(currentSettings.rate.toString());
      setFreeShippingThresholdInput(currentSettings.threshold.toString());
    } catch (e) {
      toast({ title: "Error", description: "Could not load current shipping settings.", variant: "destructive" });
      setShippingRateInput("50"); // Default if fetch fails
      setFreeShippingThresholdInput("5000"); // Default
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCurrentSettings();
  }, [fetchCurrentSettings]);

  const handleSave = async () => {
    const rate = parseFloat(shippingRateInput);
    const threshold = parseFloat(freeShippingThresholdInput);

    if (isNaN(rate) || rate < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid non-negative shipping rate.",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(threshold) || threshold < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid non-negative free shipping threshold.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const newSettings: ShippingSettings = { rate, threshold };
    const result = await updateShippingSettings(newSettings);

    if (result.success && result.settings) {
      toast({
        title: "Settings Saved",
        description: `Shipping settings updated. Rate: ₹${result.settings.rate.toFixed(2)}, Threshold: ₹${result.settings.threshold.toFixed(2)}.`,
      });
      setShippingRateInput(result.settings.rate.toString());
      setFreeShippingThresholdInput(result.settings.threshold.toString());
    } else {
      toast({
        title: "Error Saving Settings",
        description: result.error || "Could not save shipping settings.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Manage Shipment Charges</h1>
            <Card>
                <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Shipment Charges</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" /> Shipment Charges Configuration
          </CardTitle>
          <CardDescription>
            Define your store's shipping rates and free shipping thresholds. These are saved on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shippingRate">Flat Shipping Rate (₹)</Label>
            <Input
              id="shippingRate"
              type="number"
              value={shippingRateInput}
              onChange={(e) => setShippingRateInput(e.target.value)}
              placeholder="e.g., 50.00"
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
            <Input
              id="freeShippingThreshold"
              type="number"
              value={freeShippingThresholdInput}
              onChange={(e) => setFreeShippingThresholdInput(e.target.value)}
              placeholder="e.g., 5000"
              className="mt-1"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">Orders over this amount will qualify for free shipping.</p>
          </div>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Shipping Settings
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4 bg-muted/30">
        <CardHeader>
            <CardTitle className="text-lg">Shipping Application Notes</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                The saved shipping rate and free shipping threshold will be used in the cart and checkout process. Future enhancements could include: tiered shipping based on order value or weight, and regional shipping zones.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
