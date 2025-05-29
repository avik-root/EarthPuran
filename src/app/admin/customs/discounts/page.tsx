// src/app/admin/customs/discounts/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgePercent } from "lucide-react";

export default function AdminDiscountsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Discounts</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BadgePercent className="mr-2 h-5 w-5" /> Discount Configuration
          </CardTitle>
          <CardDescription>
            Set up product discounts and promotional offers. (Placeholder)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will enable you to create automatic discounts, such as "buy one get one" offers, percentage discounts on specific products or categories, or volume-based discounts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
