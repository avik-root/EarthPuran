
"use client"; 

import Image from "next/image";
import { useParams } from "next/navigation"; 
import { getProductById, getProducts } from "@/app/actions/productActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Minus, Plus, ShoppingCart, Star, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Import useToast
import Link from "next/link";


export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast(); // Initialize useToast

  useEffect(() => {
    async function fetchData() {
      if (!productId) return;
      setLoading(true);
      try {
        const fetchedProduct = await getProductById(productId);
        if (!fetchedProduct) {
          setProduct(null); 
        } else {
          setProduct(fetchedProduct);
          const allProducts = await getProducts();
          const filteredRelated = allProducts
            .filter(p => p.category === fetchedProduct.category && p.id !== fetchedProduct.id)
            .slice(0, 4);
          setRelatedProducts(filteredRelated);
        }
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        setProduct(null); 
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-12">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="w-full h-[400px] md:h-[600px] rounded-lg" />
            <div className="p-6 flex flex-col justify-center space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/2" />
              <div className="flex gap-3 w-full flex-col sm:flex-row">
                <Skeleton className="h-12 w-full sm:flex-1" />
                <Skeleton className="h-12 w-full sm:w-auto sm:px-10" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-semibold">Product Not Found</h2>
            <p className="text-muted-foreground">The product you are looking for does not exist.</p>
            <Button asChild className="mt-4">
                <Link href="/products">Go to Products</Link>
            </Button>
        </div>
    );
  }

  const isProductInWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }
    if (product.stock > 0) {
      addToCart(product, quantity);
    } else {
       toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive",
      });
    }
  };
  
  const handleToggleWishlist = () => {
    const isLoggedIn = localStorage.getItem("isLoggedInPrototype") === "true";
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in to manage your wishlist.",
        variant: "destructive",
      });
      return;
    }
    toggleWishlist(product);
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, product.stock));
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };


  return (
    <div className="space-y-12">
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-4 md:p-0">
             <Image
              src={product.imageUrl}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-auto object-cover rounded-lg shadow-lg"
              data-ai-hint={product.imageHint || "product detail"}
            />
          </div>
          <div className="p-6 flex flex-col justify-center">
            <CardHeader className="p-0">
              <Badge variant="outline" className="w-fit mb-2">{product.category}</Badge>
              <CardTitle className="text-3xl lg:text-4xl font-bold text-primary">{product.name}</CardTitle>
              <p className="text-lg text-muted-foreground">{product.brand}</p>
            </CardHeader>
            <CardContent className="p-0 mt-4 space-y-4">
              {product.rating && (
                <div className="flex items-center">
                  {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${ i < Math.floor(product.rating || 0) ? "text-primary fill-primary" : "text-muted-foreground/50" }`}/>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">({product.reviews || 0} reviews)</span>
                </div>
              )}
              <CardDescription className="text-base text-foreground/90 leading-relaxed">{product.description}</CardDescription>
              
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Available Colors:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => <Badge key={color} variant="secondary">{color}</Badge>)}
                  </div>
                </div>
              )}
              {product.shades && product.shades.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Available Shades:</p>
                  <div className="flex flex-wrap gap-2">
                    {product.shades.map(shade => <Badge key={shade} variant="secondary">{shade}</Badge>)}
                  </div>
                </div>
              )}

              <p className="text-3xl font-bold text-accent">₹{product.price.toFixed(2)}</p>
             
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Free shipping on orders over ₹5000</span>
              </div>
               <p className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>

            </CardContent>
            <CardFooter className="p-0 mt-6 space-y-4 flex-col items-start">
              {product.stock > 0 && (
                <div className="flex items-center space-x-3">
                  <p className="text-sm font-medium">Quantity:</p>
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none" onClick={decrementQuantity} disabled={quantity <= 1}><Minus className="h-4 w-4"/></Button>
                    <span className="px-4 text-sm font-medium w-10 text-center">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none" onClick={incrementQuantity} disabled={quantity >= product.stock}><Plus className="h-4 w-4"/></Button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 w-full flex-col sm:flex-row">
                <Button 
                  size="lg" 
                  className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-70" 
                  disabled={product.stock === 0 && localStorage.getItem("isLoggedInPrototype") === "true"}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={cn(
                    "w-full sm:w-auto hover:bg-accent/10 hover:border-accent hover:text-accent",
                    isProductInWishlist && "bg-accent/10 border-accent text-accent"
                    )}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={cn("mr-2 h-5 w-5", isProductInWishlist && "fill-accent")} /> 
                  {isProductInWishlist ? 'In Wishlist' : 'Wishlist'}
                </Button>
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>

      <Separator />
      <div>
        <h3 className="text-2xl font-semibold mb-4">Product Details</h3>
        <div className="prose dark:prose-invert max-w-none text-foreground/90">
            <p>More detailed information about the product, ingredients, how to use, etc., would go here. This can be structured using tabs for better organization.</p>
            <h4>Ingredients:</h4>
            <p>Aqua, Dimethicone, Cyclopentasiloxane, Mica, Butylene Glycol, etc. (List actual ingredients)</p>
            <h4>How to Use:</h4>
            <p>Apply evenly to face using fingertips, sponge, or brush. Blend well. (Provide usage instructions)</p>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div>
          <Separator className="my-8"/>
          <h2 className="text-2xl font-semibold mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {relatedProducts.map((relatedProd: Product) => (
              <ProductCard key={relatedProd.id} product={relatedProd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
