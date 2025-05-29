
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Save } from "lucide-react";

// Each customs option uses its own dedicated key in localStorage,
// acting as a separate client-side "database" for its settings.
const SHIPPING_SETTINGS_STORAGE_KEY = "earthPuranAdminShippingSettings";

interface ShippingSettings {
  rate: string;
  threshold: string;
}

export default function AdminShippingChargesPage() {
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({ rate: "50.00", threshold: "5000" });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedSettings = localStorage.getItem(SHIPPING_SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings) as ShippingSettings;
        setShippingSettings({
            rate: parsedSettings.rate !== undefined ? parsedSettings.rate : "50.00",
            threshold: parsedSettings.threshold !== undefined ? parsedSettings.threshold : "5000"
        });
      } catch (e) {
         setShippingSettings({ rate: "50.00", threshold: "5000" });
      }
    } else {
      setShippingSettings({ rate: "50.00", threshold: "5000" });
    }
    setIsLoading(false);
  }, []);

  const handleInputChange = (field: keyof ShippingSettings, value: string) => {
    setShippingSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const rate = parseFloat(shippingSettings.rate);
    const threshold = parseFloat(shippingSettings.threshold);

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

    localStorage.setItem(SHIPPING_SETTINGS_STORAGE_KEY, JSON.stringify(shippingSettings));
    toast({
      title: "Settings Saved",
      description: `Shipping settings updated. Rate: ₹${shippingSettings.rate}, Threshold: ₹${shippingSettings.threshold}.`,
    });
  };

  if (isLoading) {
    return <p>Loading shipping settings...</p>;
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
            Define your store's shipping rates and free shipping thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shippingRate">Flat Shipping Rate (₹)</Label>
            <Input
              id="shippingRate"
              type="number"
              value={shippingSettings.rate}
              onChange={(e) => handleInputChange('rate', e.target.value)}
              placeholder="e.g., 50.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (₹)</Label>
            <Input
              id="freeShippingThreshold"
              type="number"
              value={shippingSettings.threshold}
              onChange={(e) => handleInputChange('threshold', e.target.value)}
              placeholder="e.g., 5000"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Orders over this amount will qualify for free shipping.</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Shipping Settings
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Shipping Rules (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: tiered shipping based on order value or weight, free shipping thresholds, regional shipping zones, etc. The current free shipping threshold is for display purposes on product pages and not yet applied in cart/checkout.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
