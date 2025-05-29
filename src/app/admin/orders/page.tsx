
// src/app/admin/orders/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>View and manage customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Order management functionality is coming soon.</p>
            <p className="text-sm text-muted-foreground">You will be able to view order details, update statuses, and more.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
