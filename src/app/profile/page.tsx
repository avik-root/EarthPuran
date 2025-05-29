
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, MapPin, ListOrdered, Heart, PackageSearch, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';

import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { AddressManagement } from "@/components/profile/AddressManagement";
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay"; 

import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/ProductCard";
import type { Order } from "@/types/order"; 
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserData } from "@/app/actions/userActions";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { wishlistItems, clearWishlist, isLoadingWishlist, refreshWishlist } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('edit-profile');
  const [hasMounted, setHasMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null); 


  useEffect(() => {
    setHasMounted(true); 
  }, []);

  useEffect(() => {
    if (hasMounted) { 
      const email = localStorage.getItem('currentUserEmail');
      const loggedInStatus = localStorage.getItem('isLoggedInPrototype') === 'true';
      setCurrentUserEmail(email);
      setIsLoggedIn(loggedInStatus);

      const tabQueryParam = searchParams.get('tab');
      if (tabQueryParam && ['edit-profile', 'addresses', 'orders', 'wishlist'].includes(tabQueryParam)) {
        setActiveTab(tabQueryParam);
      } else if (tabQueryParam) { 
        router.replace('/profile?tab=edit-profile', { scroll: false });
      }
    }
  }, [hasMounted, searchParams, router]);

  const fetchOrders = useCallback(async () => {
    if (!currentUserEmail || !isLoggedIn || !hasMounted) { 
        setOrders([]);
        setLoadingOrders(false);
        return;
    }
    setLoadingOrders(true);
    try {
      const userData = await getUserData(currentUserEmail);
      setOrders(userData?.orders?.sort((a,b) => parseInt(b.id) - parseInt(a.id)) || []);
    } catch (error) {
      console.error("Failed to load orders for profile:", error);
      setOrders([]);
      toast({ title: "Error", description: "Could not load your order history.", variant: "destructive"});
    } finally {
      setLoadingOrders(false);
    }
  }, [currentUserEmail, toast, isLoggedIn, hasMounted]);

  useEffect(() => {
    if (hasMounted && isLoggedIn && activeTab === 'orders') { 
        fetchOrders();
    }
    if (hasMounted && isLoggedIn && activeTab === 'wishlist') { 
        refreshWishlist();
    }
  }, [activeTab, fetchOrders, isLoggedIn, hasMounted, refreshWishlist]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Processing': return 'text-yellow-600 dark:text-yellow-400';
      case 'Shipped': return 'text-blue-600 dark:text-blue-400';
      case 'Delivered': return 'text-green-600 dark:text-green-400';
      case 'Cancelled': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  };
  
  if (!hasMounted) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <Skeleton className="h-32 w-full mb-8" /> 
        <Skeleton className="h-12 w-full" /> 
        <Skeleton className="h-64 w-full mt-6" /> 
      </div>
    );
  }

  if (!isLoggedIn || !currentUserEmail) {
    const redirectTab = searchParams.get('tab') || 'edit-profile';
    return (
      <div className="space-y-8 text-center">
          <User className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Profile</h1>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
          <Button asChild className="mt-4">
            <Link href={`/login?redirect=/profile?tab=${redirectTab}`}>Login</Link>
          </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <User className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and view your activity.</p>
        </div>
      </div>

      <UserProfileDisplay /> 

      <Tabs value={activeTab} onValueChange={(value) => router.push(`/profile?tab=${value}`)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="edit-profile" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <Lock className="h-4 w-4" /> Edit Profile
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" /> Addresses
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <ListOrdered className="h-4 w-4 mr-0 sm:mr-2" />Order History
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <Heart className="h-4 w-4 mr-0 sm:mr-2" />Wishlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit-profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Edit Profile Information</CardTitle>
              <CardDescription>Update your password and security PIN.</CardDescription>
            </CardHeader>
            <CardContent>
              <EditProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Manage Delivery Addresses</CardTitle>
              <CardDescription>Add, edit, or remove your shipping addresses.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddressManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Order History</CardTitle>
                <CardDescription>View summaries of your past purchases. Click an order to see details.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                     <Skeleton className="h-24 w-full" />
                ) : !isLoggedIn ? ( 
                    <p className="text-muted-foreground text-center py-4">Please log in to view your order history.</p>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                        <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h2 className="mt-4 text-xl font-semibold text-foreground">No Orders Yet</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            You haven&apos;t placed any orders with us yet.
                        </p>                        
                        <Button asChild className="mt-4" size="sm">
                            <Link href="/products">Start Shopping</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                    {orders.map((order) => (
                       <Link key={order.id} href={`/orders/${order.id}`} className="block hover:shadow-md transition-shadow rounded-lg">
                        <Card>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-primary">Order #{order.id}</h3>
                              <p className="text-xs text-muted-foreground">Date: {order.date}</p>
                              <p className={cn("text-xs font-medium mt-0.5", getStatusColor(order.status))}>Status: {order.status}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                              <ChevronRight className="h-4 w-4 text-muted-foreground inline-block ml-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-semibold">My Wishlist</CardTitle>
                    <CardDescription>Your saved favorite products.</CardDescription>
                </div>
                {wishlistItems.length > 0 && isLoggedIn && (
                    <Button variant="outline" size="sm" onClick={clearWishlist} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-3 w-3" /> Clear Wishlist
                    </Button>
                )}
            </CardHeader>
            <CardContent>
              {isLoadingWishlist ? (
                    <Skeleton className="h-64 w-full" />
                ) : !isLoggedIn ? ( 
                    <p className="text-muted-foreground text-center py-4">Please log in to manage your wishlist.</p>
                ) : wishlistItems.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h2 className="mt-4 text-xl font-semibold text-foreground">Your Wishlist is Empty</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add your favorite products to your wishlist.
                    </p>
                    <Button asChild className="mt-4" size="sm">
                        <Link href="/products">Discover Products</Link>
                    </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-6">
                    {wishlistItems.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    </div>
                )}
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


    