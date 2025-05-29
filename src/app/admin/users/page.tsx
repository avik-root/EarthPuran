
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllUsers } from "@/app/actions/userActions";
import type { UserData } from "@/types/userData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const countriesMap: { [key: string]: string } = {
  "US": "+1", "CA": "+1", "GB": "+44", "AU": "+61", "IN": "+91",
};

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers.sort((a, b) => a.profile.email.localeCompare(b.profile.email)));
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

  const filteredUsers = users.filter(user =>
    user.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Customers</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." className="pl-10 w-full sm:w-auto" disabled />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>Loading customer data...</CardDescription>
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
      <h1 className="text-3xl font-bold tracking-tight">Manage Customers</h1>
      <CardDescription>View and manage registered customer accounts.</CardDescription>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-10 w-full sm:w-1/2 lg:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            A list of all registered customers. Click "View Details" for more actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No customers found{searchTerm && " matching your search"}.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email (User ID)</TableHead>
                  <TableHead className="hidden md:table-cell">Phone Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.profile.email}>
                    <TableCell className="font-medium">
                      {user.profile.firstName} {user.profile.lastName}
                    </TableCell>
                    <TableCell>{user.profile.email}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(countriesMap[user.profile.countryCode] || user.profile.countryCode)} {user.profile.phoneNumber}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/users/${encodeURIComponent(user.profile.email)}`}>
                          View Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
