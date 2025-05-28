
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
import { Home, Package, Users, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                isActive // Assuming this is the dashboard link
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
        {/* Footer can be added here if needed */}
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {/* Mobile sidebar trigger (optional if sidebar already has one) */}
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
