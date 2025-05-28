
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListOrdered, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order, OrderItem } from "@/types/order"; // Import centralized types

const ORDER_HISTORY_STORAGE_KEY = 'earthPuranUserOrders';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error("Failed to load orders from localStorage", error);
      setOrders([]);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-3">
                <ListOrdered className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
                    <p className="text-muted-foreground">Loading your purchase history...</p>
                </div>
            </div>
            <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    )
  }

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
          {orders.sort((a,b) => parseInt(b.id) - parseInt(a.id)).map((order) => ( // Sort by newest first
            <Card key={order.id}>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <CardDescription>
                    Date: {order.date} | Status: <span className={`font-medium ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-yellow-600'}`}>{order.status}</span>
                  </CardDescription>
                </div>
                <p className="text-xl font-semibold text-primary self-start sm:self-center">₹{order.totalAmount.toFixed(2)}</p>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2 text-sm">Items:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {order.items.map((item: OrderItem, index: number) => ( 
                    <li key={`${order.id}-item-${index}`} className="flex items-center justify-between gap-2">
                       <div className="flex items-center gap-3">
                        <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md object-cover aspect-square" data-ai-hint={item.imageHint || "product order"} />
                        <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p>Quantity: {item.quantity}</p>
                        </div>
                       </div>
                      <p className="text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
