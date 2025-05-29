
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Save } from "lucide-react";

const LOCAL_STORAGE_KEY = "earthPuranAdminShippingRate";

export default function AdminShippingChargesPage() {
  const [shippingRate, setShippingRate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedRate = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedRate) {
      setShippingRate(storedRate);
    } else {
      setShippingRate("50.00"); // Default rate
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    const rate = parseFloat(shippingRate);
    if (isNaN(rate) || rate < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid non-negative shipping rate.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, shippingRate);
    toast({
      title: "Settings Saved",
      description: `Shipping rate updated to ₹${shippingRate}.`,
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
            Define your store's flat shipping rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shippingRate">Flat Shipping Rate (₹)</Label>
            <Input
              id="shippingRate"
              type="number"
              value={shippingRate}
              onChange={(e) => setShippingRate(e.target.value)}
              placeholder="e.g., 50.00"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Shipping Rate
          </Button>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Shipping Rules (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: tiered shipping based on order value or weight, free shipping thresholds, regional shipping zones, etc.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
