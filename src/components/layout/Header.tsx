
"use client";

import Link from "next/link";
import { ShoppingBag, User, Heart, Search, Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Beauty Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");
  const router = useRouter();
  const isLoggedIn = true; // Placeholder for actual auth state

  const handleMobileSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault(); 
    if (mobileSearchTerm.trim()) {
      router.push(`/products?q=${encodeURIComponent(mobileSearchTerm.trim())}`);
      setMobileSearchTerm(""); 
      setMobileSearchOpen(false); 
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold tracking-tight text-primary">Earth Puran</span>
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Mobile Search Button & Sheet */}
          <div className="sm:hidden"> {/* Visible only on screens smaller than 'sm' */}
            <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Search products (mobile)">
                  <Search className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-4">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Search Earth Puran</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleMobileSearchSubmit} className="space-y-4">
                  <Input
                    type="search"
                    placeholder="What are you looking for?"
                    value={mobileSearchTerm}
                    onChange={(e) => setMobileSearchTerm(e.target.value)}
                    autoFocus
                    className="text-base" 
                  />
                  <Button type="submit" className="w-full">
                    Search
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          {/* Existing Search for larger screens (sm and up) */}
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
          </Button>

          <Link href="/wishlist" passHref>
            <Button variant="ghost" size="icon" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Bag">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </Link>
          
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="User Account">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">Order History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log Out (Not Implemented)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" passHref>
              <Button variant="ghost" size="icon" aria-label="Login">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                 <div className="p-4">
                    <Link href="/" className="flex items-center mb-6" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-xl font-bold tracking-tight text-primary">Earth Puran</span>
                    </Link>
                    <nav className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                        <Link
                        key={item.href}
                        href={item.href}
                        className="text-base font-medium text-foreground transition-colors hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                        >
                        {item.label}
                        </Link>
                    ))}
                    <hr className="my-3"/>
                    {isLoggedIn && (
                        <>
                            <Link href="/profile" className="text-base font-medium text-foreground transition-colors hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                                My Profile
                            </Link>
                            <Link href="/orders" className="text-base font-medium text-foreground transition-colors hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
                                Order History
                            </Link>
                        </>
                    )}
                     <Link
                        href="/admin/dashboard"
                        className="text-base font-medium text-foreground transition-colors hover:text-primary"
                        onClick={() => setMobileMenuOpen(false)}
                        >
                        Admin Dashboard
                        </Link>
                    {isLoggedIn && (
                         <Button variant="outline" onClick={() => { console.log('Logout'); setMobileMenuOpen(false);}} className="mt-4">
                            Log Out
                        </Button>
                    )}
                    </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
