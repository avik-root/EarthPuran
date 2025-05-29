
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save } from "lucide-react";

const LOCAL_STORAGE_KEY = "earthPuranAdminTaxRate";

export default function AdminTaxesPage() {
  const [taxRate, setTaxRate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedRate = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedRate) {
      setTaxRate(storedRate);
    } else {
      setTaxRate("18"); // Default tax rate (e.g., 18%)
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid tax rate between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, taxRate);
    toast({
      title: "Settings Saved",
      description: `Default tax rate updated to ${taxRate}%.`,
    });
  };
  
  if (isLoading) {
    return <p>Loading tax settings...</p>;
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
            Define a default tax rate for your products.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g., 18"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Tax Rate
          </Button>
        </CardContent>
      </Card>
       <Card className="mt-4">
        <CardHeader>
            <CardTitle className="text-lg">Advanced Tax Rules (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Future enhancements could include: tax calculation based on region (GST, VAT), product-specific tax categories, tax-inclusive/exclusive pricing options, etc.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
