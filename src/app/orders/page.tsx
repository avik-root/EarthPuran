
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListOrdered, PackageSearch, XCircle, Truck } from "lucide-react"; // Removed RotateCcw
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderItem } from "@/types/order";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

const ORDER_HISTORY_STORAGE_KEY = 'earthPuranUserOrders';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart(); // Still needed if other cart interactions exist, but not for reorder
  const { toast } = useToast();

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

  const handleCancelOrder = (orderId: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId && order.status === 'Processing'
        ? { ...order, status: 'Cancelled' as const }
        : order
    );
    if (updatedOrders.find(o => o.id === orderId)?.status === 'Cancelled') {
      setOrders(updatedOrders);
      localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify(updatedOrders));
      toast({ title: "Order Cancelled", description: `Order #${orderId} has been cancelled.` });
    } else {
      toast({ title: "Cancellation Failed", description: "Order cannot be cancelled or was not found.", variant: "destructive" });
    }
  };

  // Reorder logic removed
  // const handleReorder = (orderToReorder: Order) => { ... };

  const handleTrackPackage = (orderId: string) => {
    toast({ title: "Tracking Not Available", description: `Package tracking for order #${orderId} is not yet implemented.` });
  };
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'text-yellow-600 dark:text-yellow-400';
      case 'Shipped': return 'text-blue-600 dark:text-blue-400';
      case 'Delivered': return 'text-green-600 dark:text-green-400';
      case 'Cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };


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
            {/* Skeleton loaders for orders can be added here */}
            <div className="text-center py-12"><p className="text-muted-foreground">Loading orders...</p></div>
        </div>
    );
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
          {orders.sort((a,b) => parseInt(b.id) - parseInt(a.id)).map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                  <CardDescription>
                    Date: {order.date} | Status: <span className={cn("font-medium", getStatusColor(order.status))}>{order.status}</span>
                  </CardDescription>
                </div>
                <p className="text-xl font-semibold text-primary self-start sm:self-center">₹{order.totalAmount.toFixed(2)}</p>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2 text-sm">Items:</h4>
                <ul className="space-y-3 text-sm text-muted-foreground mb-4">
                  {order.items.map((item: OrderItem, index: number) => ( 
                    <li key={`${order.id}-item-${index}`} className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0 last:pb-0">
                       <div className="flex items-center gap-3">
                        <Image src={item.imageUrl} alt={item.name} width={60} height={60} className="rounded-md object-cover aspect-square border" data-ai-hint={item.imageHint || "product order"} />
                        <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p>Qty: {item.quantity}</p>
                            <p>Price: ₹{item.price.toFixed(2)}</p>
                        </div>
                       </div>
                      <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <h4 className="font-medium mb-2 text-sm">Shipping To:</h4>
                <div className="text-sm text-muted-foreground">
                    <p>{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
                    <p>{order.shippingDetails.address}</p>
                    <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
                    <p>{order.shippingDetails.country}</p>
                    <p>Phone: {order.shippingDetails.phoneCountryCode}{order.shippingDetails.phoneNumber}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-end pt-4">
                {order.status === 'Processing' && (
                  <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleTrackPackage(order.id)}>
                    <Truck className="mr-2 h-4 w-4" /> Track Package
                </Button>
                {/* Reorder Items button removed from here */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
