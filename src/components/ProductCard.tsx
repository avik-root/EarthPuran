
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation"; // Import useRouter and usePathname
import { useState, useEffect } from "react"; // Import useState and useEffect

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const pathname = usePathname();

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isUserActuallyLoggedIn, setIsUserActuallyLoggedIn] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    if (isClientMounted) {
      setIsUserActuallyLoggedIn(localStorage.getItem("isLoggedInPrototype") === "true");
    }
  }, [isClientMounted, pathname]); // Re-check on navigation

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isUserActuallyLoggedIn) {
      router.push("/login");
      return;
    }

    if (product.stock > 0) {
      addToCart(product);
    } else {
      setTimeout(() => {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock.`,
          variant: "destructive",
        });
      }, 0);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isUserActuallyLoggedIn) {
      router.push("/login");
      return;
    }
    toggleWishlist(product);
  };

  const isProductInWishlist = isInWishlist(product.id);

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl flex flex-col h-full group">
      <CardHeader className="p-0 relative">
        <Link href={`/products/${product.id}`} className="block">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.imageHint || "product image"}
          />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 bg-background/70 hover:bg-background text-primary rounded-full h-8 w-8",
            isProductInWishlist && "text-destructive hover:text-destructive/80"
          )}
          aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleToggleWishlist}
        >
          <Heart className={cn("h-4 w-4", isProductInWishlist && "fill-destructive")} />
        </Button>
        {product.tags && product.tags.includes("new") && (
           <Badge className="absolute top-2 left-2" variant="destructive">NEW</Badge>
        )}
         {product.stock === 0 && (
           <Badge className="absolute bottom-2 left-2 bg-destructive/80 text-destructive-foreground" variant="destructive">OUT OF STOCK</Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Link href={`/products/${product.id}`} className="block">
          <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
            {product.name}
          </CardTitle>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">{product.brand}</p>
        {product.rating && (
          <div className="flex items-center mt-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating || 0) ? "text-primary fill-primary" : "text-muted-foreground/50"
                  }`}
                />
              ))}
            <span className="ml-1 text-xs text-muted-foreground">({product.reviews || 0})</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <p className="text-xl font-bold text-primary">₹{product.price.toFixed(2)}</p>
        <Button
          size="sm"
          variant="outline"
          className="hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          onClick={handleAddToCart}
          disabled={product.stock === 0 && isUserActuallyLoggedIn}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}
