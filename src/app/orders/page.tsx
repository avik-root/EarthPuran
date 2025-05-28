
import { ListOrdered, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Sample order data - replace with actual data fetching
const sampleOrders: any[] = []; // In a real app, fetch user's orders. Removed mock data.

export default function OrdersPage() {
  const orders = sampleOrders; // In a real app, fetch user's orders

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <ListOrdered className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
            <p className="text-muted-foreground">View details of your past purchases with Earth Puran.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-6 text-2xl font-semibold text-foreground">No Orders Yet</h2>
          <p className="mt-2 text-muted-foreground">
            You haven&apos;t placed any orders with us yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>Order #{order.id}</CardTitle>
                  <CardDescription>Date: {order.date} | Status: <span className={`font-medium ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-yellow-600'}`}>{order.status}</span></CardDescription>
                </div>
                <p className="text-xl font-semibold text-primary">₹{order.total.toFixed(2)}</p>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2 text-sm">Items:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {order.items.map((item: any, index: number) => ( 
                    <li key={index} className="flex justify-between">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">View Details (Not Implemented)</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
