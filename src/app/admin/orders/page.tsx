
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { getAllUsers, updateOrderStatus } from "@/app/actions/userActions";
import type { UserData } from "@/types/userData";
import type { Order as BaseOrder } from "@/types/order"; // Renamed to avoid conflict
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, PackageCheck, FileText, Printer } from "lucide-react"; // Added FileText, Printer
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { PrintableInvoice } from "@/components/admin/PrintableInvoice"; // Import the new component

export interface EnrichedOrder extends BaseOrder { // Use BaseOrder
  customerName: string;
  customerEmail: string;
}

export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [orderToInvoice, setOrderToInvoice] = useState<EnrichedOrder | null>(null);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const users: UserData[] = await getAllUsers();
      let collectedOrders: EnrichedOrder[] = [];
      users.forEach(user => {
        if (user.orders && user.orders.length > 0) {
          const userOrders = user.orders.map(order => ({
            ...order,
            customerName: `${user.profile.firstName} ${user.profile.lastName}`,
            customerEmail: user.profile.email,
          }));
          collectedOrders = collectedOrders.concat(userOrders);
        }
      });
      collectedOrders.sort((a, b) => b.id.localeCompare(a.id)); // Newest first
      setAllOrders(collectedOrders);
    } catch (error) {
      console.error("Failed to fetch all orders:", error);
      toast({
        title: "Error",
        description: "Could not load orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);
  
  useEffect(() => {
    if (orderToInvoice) {
      const timer = setTimeout(() => {
        window.print();
        setOrderToInvoice(null); // Reset after printing
      }, 100); // Small delay to ensure component is rendered
      return () => clearTimeout(timer);
    }
  }, [orderToInvoice]);


  const handleMarkAsDelivered = async (order: EnrichedOrder) => {
    const result = await updateOrderStatus(order.customerEmail, order.id, 'Delivered');
    if (result.success && result.updatedOrder) {
      setAllOrders(prevOrders =>
        prevOrders.map(o => (o.id === order.id ? { ...o, status: 'Delivered' } : o))
      );
      toast({
        title: "Order Status Updated",
        description: `Order #${order.id} marked as Delivered.`,
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.message || "Could not update order status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: BaseOrder['status']) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300';
      case 'Shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300';
      case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) {
      return allOrders;
    }
    return allOrders.filter(order =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allOrders, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
         <Skeleton className="h-12 w-full sm:w-1/2 lg:w-1/3" />
        <Card>
          <CardHeader>
            <CardTitle>Order List</CardTitle>
            <CardDescription>Loading customer orders...</CardDescription>
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
      <CardDescription>View and manage all customer orders.</CardDescription>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID, Customer Name or Email..."
          className="pl-10 w-full sm:w-1/2 lg:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
          <CardDescription>
            A comprehensive list of all customer orders. Newest orders are shown first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No orders found{searchTerm && " matching your search"}.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Total (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{order.date}</TableCell>
                    <TableCell className="text-right">₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Order Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`} className="flex items-center">
                                <FileText className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOrderToInvoice(order)} className="flex items-center">
                            <Printer className="mr-2 h-4 w-4" /> Generate Invoice
                          </DropdownMenuItem>
                          {(order.status === 'Processing' || order.status === 'Shipped') && (
                            <DropdownMenuItem onClick={() => handleMarkAsDelivered(order)} className="flex items-center">
                              <PackageCheck className="mr-2 h-4 w-4" /> Mark as Delivered
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="printable-invoice-container">
        <PrintableInvoice order={orderToInvoice} />
      </div>
    </div>
  );
}
