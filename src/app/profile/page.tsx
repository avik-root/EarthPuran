
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, MapPin, ListOrdered, Heart, PackageSearch, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Form components
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { AddressManagement } from "@/components/profile/AddressManagement";
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay"; 

// Imports for inlined Order History and Wishlist content
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist"; // For Wishlist tab
import { ProductCard } from "@/components/ProductCard"; // For Wishlist tab

// Define Order types directly or import if moved to a types file
interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  imageHint?: string;
}
interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  // Simplified shippingDetails for display
  shippingDetails: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'Processing' | 'Shipped' | 'Delivered';
}

const ORDER_HISTORY_STORAGE_KEY = 'earthPuranUserOrders';

export default function ProfilePage() {
  const { wishlistItems, clearWishlist: clearWishlistHook } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
    setLoadingOrders(false);
  }, []);

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

      <Tabs defaultValue="edit-profile" className="w-full">
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
                <CardDescription>View details of your past purchases with Earth Puran.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingOrders ? (
                     <p className="text-muted-foreground text-center py-4">Loading orders...</p>
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
                    <div className="space-y-4">
                    {orders.sort((a,b) => parseInt(b.id) - parseInt(a.id)).map((order) => ( // Sort by newest first
                        <Card key={order.id}>
                        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                            <CardTitle className="text-base">Order #{order.id}</CardTitle>
                            <CardDescription className="text-xs">
                                Date: {order.date} | Status: <span className={`font-medium ${order.status === 'Delivered' ? 'text-green-600' : order.status === 'Shipped' ? 'text-blue-600' : 'text-yellow-600'}`}>{order.status}</span>
                            </CardDescription>
                            </div>
                            <p className="text-lg font-semibold text-primary self-start sm:self-center">₹{order.totalAmount.toFixed(2)}</p>
                        </CardHeader>
                        <CardContent>
                            <h4 className="font-medium mb-2 text-sm">Items:</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                            {order.items.map((item: OrderItem, index: number) => ( 
                                <li key={`${order.id}-item-${index}`} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded object-cover aspect-square" data-ai-hint={item.imageHint || "product order"} />
                                    <span>{item.name} (x{item.quantity})</span>
                                  </div>
                                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
                            </ul>
                            {/* <div className="mt-3 flex justify-end">
                                <Button variant="outline" size="xs">View Order Details (Not Implemented)</Button>
                            </div> */}
                        </CardContent>
                        </Card>
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
                {wishlistItems.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearWishlistHook} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-3 w-3" /> Clear Wishlist
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {wishlistItems.length === 0 ? (
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

    