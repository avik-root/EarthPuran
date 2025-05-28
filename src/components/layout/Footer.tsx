
import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">Earth Puran</h3>
            <p className="mt-2 text-sm text-foreground/80">
              Nurturing your beauty, naturally. We exclusively feature Earth Puran products.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="#" className="text-foreground/60 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-foreground/60 hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
               <Link href="#" className="text-foreground/60 hover:text-primary">
                <Youtube className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
              Shop
            </h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="/products?category=makeup" className="text-sm text-foreground/80 hover:text-primary">Makeup</Link></li>
              <li><Link href="/products?category=skincare" className="text-sm text-foreground/80 hover:text-primary">Skincare</Link></li>
              <li><Link href="/products?category=fragrance" className="text-sm text-foreground/80 hover:text-primary">Fragrance</Link></li>
              <li><Link href="/products?category=tools" className="text-sm text-foreground/80 hover:text-primary">Tools & Brushes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
              Information
            </h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="/about" className="text-sm text-foreground/80 hover:text-primary">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-foreground/80 hover:text-primary">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-foreground/80 hover:text-primary">FAQ</Link></li>
              <li><Link href="/shipping" className="text-sm text-foreground/80 hover:text-primary">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">
              My Account
            </h4>
            <ul className="mt-4 space-y-2">
              <li><Link href="/login" className="text-sm text-foreground/80 hover:text-primary">Login</Link></li>
              <li><Link href="/signup" className="text-sm text-foreground/80 hover:text-primary">Create Account</Link></li>
              <li><Link href="/wishlist" className="text-sm text-foreground/80 hover:text-primary">Wishlist</Link></li>
              <li><Link href="/orders" className="text-sm text-foreground/80 hover:text-primary">Order History</Link></li>
              <li><Link href="/admin/login" className="text-sm text-foreground/80 hover:text-primary">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border/40 pt-8 text-center text-sm text-foreground/60">
          &copy; {currentYear} Earth Puran. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
