
"use client";

import { useEffect, useState } from "react";
import { getAllUsers, deleteUserByEmail } from "@/app/actions/userActions";
import type { UserData, UserAddress } from "@/types/userData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, User, Mail, Phone, Home, Loader2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const countriesMap: { [key: string]: string } = {
  "US": "+1", "CA": "+1", "GB": "+44", "AU": "+61", "IN": "+91",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers.sort((a,b) => a.profile.email.localeCompare(b.profile.email)));
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "Error",
          description: "Could not load users.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  const handleDeleteClick = (user: UserData) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const result = await deleteUserByEmail(userToDelete.profile.email);
    if (result.success) {
      setUsers(prevUsers => prevUsers.filter(u => u.profile.email !== userToDelete.profile.email));
      toast({
        title: "User Deleted",
        description: `User ${userToDelete.profile.email} has been successfully deleted.`,
      });
    } else {
      toast({
        title: "Error Deleting User",
        description: result.message || "Could not delete the user.",
        variant: "destructive",
      });
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Customers</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
              <CardFooter><Skeleton className="h-10 w-24 ml-auto" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Manage Customers</h1>
      <CardDescription>View and manage registered customers.</CardDescription>

      {users.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No customers found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.profile.email} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  {user.profile.firstName} {user.profile.lastName}
                </CardTitle>
                <CardDescription>User ID: {user.profile.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm flex-grow">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {countriesMap[user.profile.countryCode] || user.profile.countryCode} {user.profile.phoneNumber}
                  </span>
                </div>
                {user.addresses && user.addresses.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" /> Addresses:
                      </h4>
                      {user.addresses.map((addr: UserAddress, index: number) => (
                        <div key={addr.id || index} className="pl-4 text-xs border-l-2 ml-2 py-1">
                          <p>{addr.street}, {addr.city}</p>
                          <p>{addr.state}, {addr.zipCode}, {addr.country}</p>
                          {addr.isDefault && <Badge variant="secondary" className="mt-1">Default</Badge>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                 {user.isAdmin && (
                    <Badge variant="outline" className="mt-2 border-primary text-primary">ADMIN</Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(user)}
                  className="w-full"
                  disabled={isDeleting && userToDelete?.profile.email === user.profile.email}
                >
                  {isDeleting && userToDelete?.profile.email === user.profile.email ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete User
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              <strong className="px-1">{userToDelete?.profile.email}</strong>
              and all their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    