
"use client";

import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlistItems, clearWishlist } = useWishlist();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">My Wishlist</h1>
        {wishlistItems.length > 0 && (
            <Button variant="outline" onClick={clearWishlist} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Wishlist
            </Button>
        )}
      </div>
      {wishlistItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h2 className="mt-6 text-2xl font-semibold text-foreground">Your Wishlist is Empty</h2>
          <p className="mt-2 text-muted-foreground">
            Add your favorite products to your wishlist to keep track of them.
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">Discover Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {wishlistItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
