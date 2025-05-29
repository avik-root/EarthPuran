
'use client';

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Home, Package, Users, Settings, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
        setLoading(false); 
        return;
    }

    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";
    const isAdmin = localStorage.getItem("isAdminPrototype") === "true";

    if (!isLoggedIn) {
      router.push(`/login?redirect=${pathname}`); // Redirect to main login
      setIsAuthorized(false);
    } else if (!isAdmin) {
      setIsAuthorized(false); // User is logged in but not an admin
    } else {
      setIsAuthorized(true); // User is logged in and is an admin
    }
    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
            <LayoutDashboard className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Verifying Admin Access...</p>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!isAuthorized && !loading) { // Check loading to avoid flashing access denied
    return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
                        <ShieldAlert className="h-8 w-8" /> Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">You do not have permission to view this admin area. Please log in as an administrator.</p>
                    <Button asChild>
                        <Link href="/login">Go to Login</Link>
                    </Button>
                     <Button variant="link" asChild className="mt-2 text-sm">
                        <Link href="/">Back to Store</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  // If authorized for admin routes, render the admin sidebar layout.
  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
                EarthPuran Admin
              </h1>
            </Link>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                href="/admin/dashboard"
                tooltip="Dashboard"
                isActive={pathname === '/admin/dashboard'}
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/products" tooltip="Products" isActive={pathname.startsWith('/admin/products')}>
                  <Package /> <span>Products</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/orders" tooltip="Orders (coming soon)" isActive={pathname.startsWith('/admin/orders')}>
                  <Users /> <span>Orders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/users" tooltip="Users (coming soon)" isActive={pathname.startsWith('/admin/users')}>
                  <Users /> <span>Customers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
               <SidebarMenuItem>
                <SidebarMenuButton href="/admin/settings" tooltip="Settings (coming soon)" isActive={pathname.startsWith('/admin/settings')}>
                  <Settings /> <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton href="/" tooltip="View Store">
                  <Home /> <span>View Store</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <Avatar>
              <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar"/>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    