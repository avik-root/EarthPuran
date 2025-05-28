
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ListOrdered, PackageSearch, XCircle, Truck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderItem } from "@/types/order";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ORDER_HISTORY_STORAGE_KEY = 'earthPuranUserOrders';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // To update localStorage
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!orderId) return;
    try {
      const storedOrders = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
      if (storedOrders) {
        const parsedOrders: Order[] = JSON.parse(storedOrders);
        setAllOrders(parsedOrders);
        const currentOrder = parsedOrders.find(o => o.id === orderId);
        setOrder(currentOrder || null);
      }
    } catch (error) {
      console.error("Failed to load order from localStorage", error);
      setOrder(null);
    }
    setLoading(false);
  }, [orderId]);

  const handleCancelOrder = () => {
    if (!order || order.status !== 'Processing') {
      toast({ title: "Cancellation Failed", description: "Order cannot be cancelled or was not found.", variant: "destructive" });
      return;
    }

    const updatedOrder = { ...order, status: 'Cancelled' as const };
    const updatedAllOrders = allOrders.map(o => (o.id === orderId ? updatedOrder : o));
    
    setOrder(updatedOrder);
    setAllOrders(updatedAllOrders);
    localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify(updatedAllOrders));
    toast({ title: "Order Cancelled", description: `Order #${orderId} has been cancelled.` });
  };

  const handleTrackPackage = () => {
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
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-24 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 text-center">
         <Button variant="outline" onClick={() => router.push('/orders')} className="mb-6 mr-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Order Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The order you are looking for does not exist or could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/orders')} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Orders
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl text-primary">Order #{order.id}</CardTitle>
              <CardDescription>
                Date Placed: {order.date}
              </CardDescription>
            </div>
            <div className="text-left sm:text-right">
                 <p className={cn("text-lg font-semibold", getStatusColor(order.status))}>{order.status}</p>
                 <p className="text-xl font-bold text-foreground">Total: ₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Items Ordered</h3>
            <ul className="space-y-4">
              {order.items.map((item: OrderItem, index: number) => (
                <li key={`${order.id}-item-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover aspect-square border" 
                    data-ai-hint={item.imageHint || "product order item"} 
                  />
                  <div className="flex-grow">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    <p className="text-sm text-muted-foreground">Price per item: ₹{item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold text-foreground text-right sm:ml-auto">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Shipping Details</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground/90">Recipient:</span> {order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
              <p><span className="font-medium text-foreground/90">Address:</span> {order.shippingDetails.address}</p>
              <p><span className="font-medium text-foreground/90">City:</span> {order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
              <p><span className="font-medium text-foreground/90">Country:</span> {order.shippingDetails.country}</p>
              <p><span className="font-medium text-foreground/90">Phone:</span> {order.shippingDetails.phoneCountryCode}{order.shippingDetails.phoneNumber}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 justify-end pt-6 border-t">
          {order.status === 'Processing' && (
            <Button variant="destructive" size="sm" onClick={handleCancelOrder}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel Order
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleTrackPackage}>
            <Truck className="mr-2 h-4 w-4" /> Track Package
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
