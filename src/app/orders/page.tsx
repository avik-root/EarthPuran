
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ListOrdered, PackageSearch, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@/types/order";
import { cn } from "@/lib/utils";
import { getUserData } from "@/app/actions/userActions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentUserEmail');
      setCurrentUserEmail(email);
      if (!email) { // If not logged in, redirect
          // toast({title: "Login Required", description: "Please log in to view orders.", variant:"destructive"});
          // router.push("/login?redirect=/orders"); // Optional: redirect from here too
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const fetchOrders = useCallback(async () => {
    if (!currentUserEmail) {
        setLoading(false); 
        return;
    }
    setLoading(true);
    try {
      const userData = await getUserData(currentUserEmail);
      setOrders(userData?.orders?.sort((a,b) => parseInt(b.id) - parseInt(a.id)) || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
      toast({ title: "Error", description: "Could not load your order history.", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  }, [currentUserEmail, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
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
            <Card><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
        </div>
    );
  }

  if (!currentUserEmail && !loading) {
    return (
         <div className="space-y-8 text-center">
            <ListOrdered className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
            <p className="text-muted-foreground">Please log in to view your order history.</p>
            <Button asChild className="mt-4"><Link href="/login?redirect=/orders">Login</Link></Button>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <ListOrdered className="h-10 w-10 text-primary" />
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Order History</h1>
            <p className="text-muted-foreground">View summaries of your past purchases. Click an order to see details.</p>
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
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block hover:shadow-lg transition-shadow rounded-lg">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-primary">Order #{order.id}</h3>
                    <p className="text-xs text-muted-foreground">Date: {order.date}</p>
                    <p className={cn("text-xs font-medium mt-1", getStatusColor(order.status))}>Status: {order.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                    <ChevronRight className="h-5 w-5 text-muted-foreground inline-block ml-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
