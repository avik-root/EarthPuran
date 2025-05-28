
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
import { Home, Package, Users, Settings, LayoutDashboard, ShieldAlert, KeyRound, UserPlus } from "lucide-react";
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
  const [isAuthorizedForProtectedRoutes, setIsAuthorizedForProtectedRoutes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gatePassed = localStorage.getItem("adminAccessGranted") === "true";
    const adminConfigured = localStorage.getItem("adminCredentialsConfigured") === "true";
    const isAdmin = localStorage.getItem("isAdminPrototype") === "true";
    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";

    const isFullyAuthenticatedForDashboard = gatePassed && adminConfigured && isAdmin && isLoggedIn;

    if (pathname === '/admin/access-gate' || pathname === '/admin/login') {
      // If on public admin auth pages but already fully authenticated for dashboard, redirect
      if (isFullyAuthenticatedForDashboard && pathname !== '/admin/dashboard') {
        router.push('/admin/dashboard');
      }
      // These pages are part of the auth flow, allow rendering them.
      // The pages themselves might have further checks (e.g., login page checks gate).
    } else {
      // Protected admin routes (e.g., /admin/dashboard, /admin/products)
      if (!gatePassed) {
        router.push('/admin/access-gate');
        setIsAuthorizedForProtectedRoutes(false);
      } else if (!adminConfigured) {
        // If gate passed but admin not configured, redirect to login page which handles setup
        router.push('/admin/login');
        setIsAuthorizedForProtectedRoutes(false);
      } else if (!isLoggedIn || !isAdmin) {
        // If gate passed, admin configured, but not logged in as admin, redirect to login
        router.push('/admin/login');
        setIsAuthorizedForProtectedRoutes(false);
      } else {
        // All checks passed for protected routes
        setIsAuthorizedForProtectedRoutes(true);
      }
    }
    setLoading(false);
  }, [router, pathname]);

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

  // If current path is part of the auth flow (access gate or login/setup), render its content directly.
  // These pages manage their own UI and don't need the full admin sidebar layout.
  if (pathname === '/admin/access-gate' || pathname === '/admin/login') {
    return <>{children}</>;
  }

  // For all other /admin/* routes (e.g., /admin/dashboard, /admin/products):
  // These are protected. If not authorized, show Access Denied card.
  if (!isAuthorizedForProtectedRoutes) {
    // Determine correct link based on what's missing
    let missingStepLink = "/admin/access-gate";
    if (localStorage.getItem("adminAccessGranted") === "true" && localStorage.getItem("adminCredentialsConfigured") !== "true") {
        missingStepLink = "/admin/login"; // This will show create admin form
    } else if (localStorage.getItem("adminAccessGranted") === "true" && localStorage.getItem("adminCredentialsConfigured") === "true") {
        missingStepLink = "/admin/login"; // This will show login form
    }

    return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
                        <ShieldAlert className="h-8 w-8" /> Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">You do not have permission to view this page or need to complete setup.</p>
                    <Button asChild>
                        <Link href={missingStepLink}>Verify Access / Complete Setup</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  // If authorized for a protected route, render with sidebar
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
