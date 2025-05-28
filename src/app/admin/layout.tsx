
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
import { Home, Package, Users, Settings, LayoutDashboard, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gatePassed = localStorage.getItem("adminAccessGranted") === "true";
    const isAdmin = localStorage.getItem("isAdminPrototype") === "true";
    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";

    if (!gatePassed) {
      router.push('/admin/access-gate');
    } else if (!isLoggedIn || !isAdmin) {
      router.push('/admin/login'); 
    } else {
      setIsAuthorized(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
            <KeyRound className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-muted-foreground">Verifying Admin Access...</p>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // This state should ideally be handled by the redirects in useEffect,
    // but as a fallback:
    return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
                        <ShieldAlert className="h-8 w-8" /> Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">You do not have permission to view this page.</p>
                    <Button asChild>
                        <Link href="/admin/access-gate">Verify Access</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

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
                isActive 
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/products" tooltip="Products">
                  <Package /> <span>Products</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/orders" tooltip="Orders (coming soon)">
                  <Users /> <span>Orders</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton href="/admin/users" tooltip="Users (coming soon)">
                  <Users /> <span>Customers</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
               <SidebarMenuItem>
                <SidebarMenuButton href="/admin/settings" tooltip="Settings (coming soon)">
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
              <AvatarImage src="https://placehold.co/40x40.png" alt="Admin" data-ai-hint="user avatar" />
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
