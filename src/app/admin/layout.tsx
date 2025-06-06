// src/app/admin/layout.tsx
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
} from '@/components/ui/sidebar';
import { Home, Package, Users, Settings, LayoutDashboard, ShieldAlert, UserCircle, LogOut, SlidersHorizontal, Truck, Percent, Ticket, BadgePercent, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isAuthorizedForProtectedRoutes, setIsAuthorizedForProtectedRoutes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";
    const isAdmin = localStorage.getItem("isAdminPrototype") === "true";
    const currentAdminEmail = localStorage.getItem("currentUserEmail"); 
    setAdminEmail(currentAdminEmail);

    setLoading(true); 

    if (pathname === '/admin/login') {
      if (isLoggedIn && isAdmin) {
        router.push('/admin/dashboard'); 
      }
      setIsAuthorizedForProtectedRoutes(false); 
    } else { 
      if (!isLoggedIn || !isAdmin) {
        router.push(`/admin/login?redirect=${pathname}`);
        setIsAuthorizedForProtectedRoutes(false);
      } else {
        setIsAuthorizedForProtectedRoutes(true);
      }
    }
    setLoading(false);
  }, [router, pathname]);

  const handleAdminLogout = () => {
    localStorage.removeItem("isLoggedInPrototype");
    localStorage.removeItem("isAdminPrototype");
    localStorage.removeItem("currentUserEmail");
    setAdminEmail(null);
    toast({ title: "Admin Logged Out", description: "You have been successfully logged out." });
    router.push("/admin/login");
  };

  if (loading && pathname !== '/admin/login') {
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
  
  if (pathname !== '/admin/login' && !isAuthorizedForProtectedRoutes && !loading) {
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
              <Link href="/admin/login">Go to Admin Login</Link>
            </Button>
            <Button variant="link" asChild className="mt-2 text-sm">
              <Link href="/">Back to Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <main className="flex-grow bg-background">{children}</main>;
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
                EarthPuran Admin
              </h1>
            </Link>
            <SidebarTrigger /> 
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
                <SidebarMenuButton href="/admin/orders" tooltip="Orders" isActive={pathname.startsWith('/admin/orders')}>
                  <Users /> <span>Orders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/users" tooltip="Customers" isActive={pathname.startsWith('/admin/users')}>
                  <Users /> <span>Customers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/blogs/new" tooltip="Write Blogs" isActive={pathname.startsWith('/admin/blogs/new')}>
                  <FileText /> <span>Write Blogs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/blogs" tooltip="Manage Blogs" isActive={pathname === '/admin/blogs'}>
                  <FileText /> <span>Manage Blogs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Customs</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/customs/shipping" tooltip="Shipment Charges" isActive={pathname.startsWith('/admin/customs/shipping')}>
                  <Truck /> <span>Shipment Charges</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/customs/taxes" tooltip="Taxes" isActive={pathname.startsWith('/admin/customs/taxes')}>
                  <Percent /> <span>Taxes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/customs/coupons" tooltip="Coupons" isActive={pathname.startsWith('/admin/customs/coupons')}>
                  <Ticket /> <span>Coupons</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/customs/discounts" tooltip="Discounts" isActive={pathname.startsWith('/admin/customs/discounts')}>
                  <BadgePercent /> <span>Discounts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/settings" tooltip="Admin Settings" isActive={pathname.startsWith('/admin/settings')}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar" />
                    <AvatarFallback>{adminEmail ? adminEmail.substring(0,2).toUpperCase() : 'AD'}</AvatarFallback>
                  </Avatar>
                   <span className="sr-only">Admin Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                {adminEmail && <DropdownMenuSeparator />}
                {adminEmail && <DropdownMenuItem disabled className="text-xs text-muted-foreground">{adminEmail}</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAdminLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
        <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
