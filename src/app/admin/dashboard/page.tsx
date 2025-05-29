
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, CreditCard, Users, Activity, Loader2 } from "lucide-react";
import { getProducts } from "@/app/actions/productActions";
import { getAllUsers } from "@/app/actions/userActions";
import type { UserData } from "@/types/userData";
import type { Order } from "@/types/order";
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardData {
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrdersCount: number;
  recentOrders: Order[];
  loading: boolean;
}

async function fetchDashboardData(): Promise<Omit<DashboardData, 'loading'>> {
  const products = await getProducts();
  const allUsersData: UserData[] = await getAllUsers();

  let totalRevenue = 0;
  let pendingOrdersCount = 0;
  let allOrders: Order[] = [];

  allUsersData.forEach(user => {
    if (user.orders) {
      allOrders = allOrders.concat(user.orders);
      user.orders.forEach(order => {
        if (order.status === 'Delivered') {
          totalRevenue += order.totalAmount;
        }
        if (order.status === 'Processing') {
          pendingOrdersCount++;
        }
      });
    }
  });

  const totalProducts = products.length;
  const totalCustomers = allUsersData.length;
  const recentOrders = allOrders.sort((a,b) => b.id.localeCompare(a.id)).slice(0,3);

  return {
    totalRevenue,
    totalProducts,
    totalCustomers,
    pendingOrdersCount,
    recentOrders,
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrdersCount: 0,
    recentOrders: [],
    loading: true,
  });

  const loadData = useCallback(async () => {
    if (!data.loading) { // Only set loading if not already loading, to prevent flicker on auto-refresh
        setData(prev => ({ ...prev, loading: true, recentOrders: prev.recentOrders })); // Keep recent orders to avoid layout shift
    }
    const fetchedData = await fetchDashboardData();
    setData({ ...fetchedData, loading: false });
  }, [data.loading]);

  useEffect(() => {
    loadData(); // Initial load
    const intervalId = setInterval(() => {
      loadData();
    }, 5000); // Auto-reload every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount for interval setup

  if (data.loading && data.recentOrders.length === 0) { // Show full skeleton only on initial true loading
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        {data.loading && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From 'Delivered' orders</p>
          </CardContent>
        </Card>

        <Link href="/admin/products" className="hover:shadow-lg transition-shadow rounded-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Currently in store</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="hover:shadow-lg transition-shadow rounded-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/orders" className="hover:shadow-lg transition-shadow rounded-lg">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground">'Processing' status</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent store events.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length > 0 ? (
            <ul className="space-y-3">
              {data.recentOrders.map(order => (
                <li key={order.id} className="text-sm text-muted-foreground">
                  New order <Link href={`/orders/${order.id}`} className="font-semibold text-primary hover:underline">#{order.id}</Link> placed by <span className="font-semibold text-foreground">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</span> for ₹{order.totalAmount.toFixed(2)}.
                </li>
              ))}
               {data.totalCustomers > 0 && (
                 <li className="text-sm text-muted-foreground">
                   Total <span className="font-semibold text-foreground">{data.totalCustomers}</span> customer(s) registered.
                 </li>
               )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
