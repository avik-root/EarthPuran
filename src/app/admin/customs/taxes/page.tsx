// src/app/admin/customs/taxes/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";

export default function AdminTaxesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Taxes</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Percent className="mr-2 h-5 w-5" /> Tax Configuration
          </CardTitle>
          <CardDescription>
            Set up tax rates and rules for your products and shipping. (Placeholder)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will allow you to configure tax settings, such as GST, VAT, or other applicable taxes based on region or product type.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
