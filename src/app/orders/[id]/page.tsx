
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ListOrdered, PackageSearch, XCircle, Truck, ArrowLeft, CheckCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderItem } from "@/types/order";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserData, updateUserOrders, getAllUsers, updateOrderStatus } from "@/app/actions/userActions";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [orderOwnerEmail, setOrderOwnerEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentUserEmail');
      const isAdmin = localStorage.getItem('isAdminPrototype') === 'true';
      setCurrentUserEmail(email);
      setIsCurrentUserAdmin(isAdmin);
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
        setOrder(null);
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      let foundOrder: Order | undefined | null = null;
      let ownerEmail: string | null = null;

      if (isCurrentUserAdmin) {
        const allUsers = await getAllUsers();
        for (const user of allUsers) {
          const o = user.orders?.find(ord => ord.id === orderId);
          if (o) {
            foundOrder = o;
            ownerEmail = user.profile.email;
            break;
          }
        }
      } else if (currentUserEmail) {
        const userData = await getUserData(currentUserEmail);
        foundOrder = userData?.orders?.find(o => o.id === orderId);
        if (foundOrder) {
            ownerEmail = currentUserEmail;
        }
      }
      setOrder(foundOrder || null);
      setOrderOwnerEmail(ownerEmail);

    } catch (error) {
      console.error("Failed to load order details:", error);
      setOrder(null);
      setOrderOwnerEmail(null);
      toast({ title: "Error", description: "Could not load order details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [orderId, currentUserEmail, isCurrentUserAdmin, toast]);

  useEffect(() => {
    if (currentUserEmail || isCurrentUserAdmin) {
        fetchOrderDetails();
    } else if (typeof window !== 'undefined' && !localStorage.getItem('currentUserEmail')) {
        setLoading(false);
    }
  }, [fetchOrderDetails, currentUserEmail, isCurrentUserAdmin]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'Processing' || !orderOwnerEmail) {
      toast({ title: "Cancellation Failed", description: "Order cannot be cancelled or was not found.", variant: "destructive" });
      return;
    }

    const result = await updateOrderStatus(orderOwnerEmail, order.id, 'Cancelled');
    if (result.success && result.updatedOrder) {
        setOrder(result.updatedOrder); 
        toast({ title: "Order Cancelled", description: `Order #${orderId} has been cancelled.` });
    } else {
        toast({ title: "Cancellation Error", description: result.message || "Could not cancel the order.", variant: "destructive" });
    }
  };
  
  const handleMarkAsDelivered = async () => {
    if (!order || !isCurrentUserAdmin || (order.status !== 'Processing' && order.status !== 'Shipped') || !orderOwnerEmail ) {
      toast({ title: "Action Failed", description: "Order cannot be marked as delivered or you don't have permission.", variant: "destructive" });
      return;
    }
    const result = await updateOrderStatus(orderOwnerEmail, order.id, 'Delivered');
    if (result.success && result.updatedOrder) {
      setOrder(result.updatedOrder);
      toast({ title: "Order Status Updated", description: `Order #${order.id} marked as Delivered.` });
    } else {
      toast({ title: "Update Failed", description: result.message || "Could not update order status.", variant: "destructive"});
    }
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

  const handleBackNavigation = () => {
    if (isCurrentUserAdmin) {
      router.push('/admin/orders'); 
    } else {
      router.push('/profile?tab=orders');
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-36 mb-2" />
        <Card>
          <CardHeader><Skeleton className="h-12 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (!currentUserEmail && !isCurrentUserAdmin && !loading) { 
    return (
         <div className="space-y-6 text-center">
            <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-6 text-2xl font-semibold text-foreground">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">Please log in to view order details.</p>
            <Button asChild className="mt-4"><Link href={`/login?redirect=/orders/${orderId}`}>Login</Link></Button>
        </div>
    )
  }

  if (!order && !loading) {
    return (
      <div className="space-y-6 text-center">
         <Button variant="outline" onClick={handleBackNavigation} className="mb-6 mr-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Orders
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
      <Button variant="outline" onClick={handleBackNavigation} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Orders
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl text-primary flex items-center gap-2">
                <ShoppingBag className="h-7 w-7" /> Order #{order.id}
              </CardTitle>
              <CardDescription>
                Date Placed: {order.date}
                {isCurrentUserAdmin && orderOwnerEmail && (
                  <span className="block text-xs mt-1">Customer: {orderOwnerEmail}</span>
                )}
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
          {order.status === 'Processing' && (isCurrentUserAdmin || currentUserEmail === orderOwnerEmail) && (
            <Button variant="destructive" size="sm" onClick={handleCancelOrder}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel Order
            </Button>
          )}
          {isCurrentUserAdmin && (order.status === 'Processing' || order.status === 'Shipped') && (
             <Button variant="default" size="sm" onClick={handleMarkAsDelivered} className="bg-green-600 hover:bg-green-700 text-white">
               <CheckCircle className="mr-2 h-4 w-4" /> Mark as Delivered
             </Button>
          )}
          {(order.status === 'Processing' || order.status === 'Shipped') && (
            <Button variant="outline" size="sm" onClick={handleTrackPackage}>
              <Truck className="mr-2 h-4 w-4" /> Track Package
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
