
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUserData, deleteUserByEmail } from "@/app/actions/userActions";
import type { UserData, UserAddress, Order, FullCartItem } from "@/types/userData"; // Assuming Order and FullCartItem are here
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { User, Mail, Phone, Home, ShoppingBag, Heart, Trash2, ArrowLeft, PackageSearch, ListOrdered, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const countriesMap: { [key: string]: string } = {
  "US": "+1", "CA": "+1", "GB": "+44", "AU": "+61", "IN": "+91",
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const userEmail = params.email ? decodeURIComponent(params.email as string) : null;

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      toast({ title: "Error", description: "User email not found in URL.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const fetchedUser = await getUserData(userEmail);
      setUser(fetchedUser);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast({ title: "Error", description: "Could not load user details.", variant: "destructive" });
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail, toast]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleDeleteUser = async () => {
    if (!user) return;
    setIsDeleting(true);
    const result = await deleteUserByEmail(user.profile.email);
    if (result.success) {
      toast({
        title: "User Deleted",
        description: `User ${user.profile.email} has been successfully deleted.`,
      });
      router.push("/admin/users");
    } else {
      toast({
        title: "Error Deleting User",
        description: result.message || "Could not delete the user.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
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
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid md:grid-cols-2 gap-6">
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 text-center p-4">
         <Button variant="outline" onClick={() => router.push('/admin/users')} className="mb-6 mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
        <User className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 text-2xl font-semibold">User Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The user details for "{userEmail}" could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
        </Button>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Delete User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {user.profile.firstName} {user.profile.lastName}
          </CardTitle>
          <CardDescription>User ID: {user.profile.email} {user.profile.isAdmin && <Badge variant="outline" className="ml-2 border-primary text-primary">ADMIN</Badge>}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.profile.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{(countriesMap[user.profile.countryCode] || user.profile.countryCode)} {user.profile.phoneNumber}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Home className="h-5 w-5 text-primary" /> Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {user.addresses && user.addresses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {user.addresses.map((addr: UserAddress, index: number) => (
                <Card key={addr.id || index} className={cn(addr.isDefault && "border-primary")}>
                  <CardContent className="p-4 text-sm space-y-1">
                    <p className="font-semibold">{addr.street}</p>
                    <p>{addr.city}, {addr.state}</p>
                    <p>{addr.zipCode}, {addr.country}</p>
                    {addr.isDefault && <Badge variant="secondary" className="mt-1">Default</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No addresses saved for this user.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary" /> Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {user.orders && user.orders.length > 0 ? (
            <div className="space-y-3">
              {user.orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block hover:shadow-md transition-shadow rounded-lg">
                  <Card>
                    <CardContent className="p-3 flex items-center justify-between text-sm">
                      <div>
                        <h3 className="font-semibold text-primary">Order #{order.id}</h3>
                        <p className="text-xs text-muted-foreground">Date: {order.date}</p>
                        <p className={cn("text-xs font-medium mt-0.5", getStatusColor(order.status))}>Status: {order.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <PackageSearch className="mx-auto h-10 w-10 mb-2" />
              This user has not placed any orders.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Wishlist</CardTitle>
        </CardHeader>
        <CardContent>
          {user.wishlist && user.wishlist.length > 0 ? (
            <ScrollArea className="h-[200px] w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                {user.wishlist.map((product: Product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <Card className="overflow-hidden h-full flex flex-col">
                      <Image src={product.imageUrl} alt={product.name} width={150} height={150} className="w-full h-32 object-cover" data-ai-hint={product.imageHint || "product small"}/>
                      <CardContent className="p-2 text-xs flex-grow">
                        <p className="font-medium truncate" title={product.name}>{product.name}</p>
                        <p className="text-muted-foreground">₹{product.price.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Heart className="mx-auto h-10 w-10 mb-2 opacity-50" />
              This user's wishlist is empty.
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              <strong className="px-1">{user.profile.email}</strong>
              and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
