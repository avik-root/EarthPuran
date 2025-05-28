import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WishlistPage() {
  // In a real app, you would fetch wishlist items for the logged-in user
  const wishlistItems: any[] = []; // Placeholder

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-primary">My Wishlist</h1>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Map through wishlistItems and display ProductCard components */}
          {/* Example: <ProductCard product={item.product} /> */}
        </div>
      )}
    </div>
  );
}
