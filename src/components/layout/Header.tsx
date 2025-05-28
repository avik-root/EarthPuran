
"use client";

import Link from "next/link";
import { ShoppingBag, User, Heart, Search, Menu, UserCircle, LogOut, Settings, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // New state for admin
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after initial render
    const storedLoginStatus = localStorage.getItem("isLoggedInPrototype") === "true";
    const storedAdminStatus = localStorage.getItem("isAdminPrototype") === "true";
    setIsLoggedIn(storedLoginStatus);
    setIsAdmin(storedLoginStatus && storedAdminStatus); // Admin only if also logged in
    setHasMounted(true); // Set hasMounted to true after login state is determined
  }, []);


  const handleMobileSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mobileSearchTerm.trim()) {
      router.push(`/products?q=${encodeURIComponent(mobileSearchTerm.trim())}`);
      setMobileSearchTerm("");
      setMobileSearchOpen(false);
      setMobileMenuOpen(false); 
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false); // Clear admin status on logout
    localStorage.removeItem("isLoggedInPrototype");
    localStorage.removeItem("isAdminPrototype"); // Clear admin flag from storage
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    setMobileMenuOpen(false); 
    router.push("/"); 
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
          {/* Mobile Search Sheet Trigger */}
          <div className="sm:hidden">
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

          {/* Desktop Search Button (Placeholder functionality) */}
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
          </Button>

          {/* Wishlist Button */}
          <Link href="/wishlist" passHref>
            <Button variant="ghost" size="icon" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          {/* Cart Button */}
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Bag">
              <ShoppingBag className="h-5 w-5" />
            </Button>
          </Link>

          {/* Dynamic Auth UI and Theme Toggle - Rendered only after client mount */}
          {hasMounted ? (
            <>
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
                      <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders"><ListOrdered className="mr-2 h-4 w-4" />Order History</Link>
                    </DropdownMenuItem>
                    {isAdmin && ( // Conditionally render Admin Dashboard link
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard"><Settings className="mr-2 h-4 w-4" />Admin Dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              )}
              <ThemeToggle />
            </>
          ) : (
            // Static placeholders for SSR and initial client render.
            // These MUST be identical on server and client's first pass.
            <>
              <div style={{ width: 'auto', minWidth:'60px', height: '36px' }} aria-hidden="true" /> {/* Approx space for Login button / UserMenu trigger */}
              <div style={{ width: '40px', height: '40px' }} aria-hidden="true" /> {/* Approx space for ThemeToggle icon button */}
            </>
          )}

          {/* Mobile Menu Trigger */}
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
                    {hasMounted ? ( // Only render dynamic auth section after mount
                        isLoggedIn ? (
                          <>
                              <Link href="/profile" className="text-base font-medium text-foreground transition-colors hover:text-primary flex items-center" onClick={() => setMobileMenuOpen(false)}>
                                  <User className="mr-2 h-4 w-4" /> My Profile
                              </Link>
                              <Link href="/orders" className="text-base font-medium text-foreground transition-colors hover:text-primary flex items-center" onClick={() => setMobileMenuOpen(false)}>
                                 <ListOrdered className="mr-2 h-4 w-4" /> Order History
                              </Link>
                              {isAdmin && ( // Conditionally render Admin Dashboard link in mobile
                                <Link
                                  href="/admin/dashboard"
                                  className="text-base font-medium text-foreground transition-colors hover:text-primary flex items-center"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <Settings className="mr-2 h-4 w-4" /> Admin Dashboard
                                </Link>
                              )}
                              <Button variant="outline" onClick={handleLogout} className="mt-4 flex items-center justify-center">
                                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                              </Button>
                          </>
                        ) : (
                           <Button asChild className="w-full mt-4" onClick={() => setMobileMenuOpen(false)}>
                              <Link href="/login">Login / Sign Up</Link>
                           </Button>
                        )
                    ) : (
                       // Placeholder for mobile menu auth section before mount
                       <div className="h-10 mt-4" aria-hidden="true" />
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
