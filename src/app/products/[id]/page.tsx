
"use client";

import Image from "next/image";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getProductById, getProducts, addProductReview, type NewReviewData } from "@/app/actions/productActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Minus, Plus, ShoppingCart, Star, Truck, MessageSquare, Send, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import type { Product, Review } from "@/types/product";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import type { UserProfile } from "@/types/userData";


const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required.").max(5, "Rating cannot exceed 5."),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(500, "Comment cannot exceed 500 characters."),
});
type ReviewFormValues = z.infer<typeof reviewSchema>;


export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const pathname = usePathname();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isUserActuallyLoggedIn, setIsUserActuallyLoggedIn] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });


  const fetchProductData = useCallback(async () => {
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
  }, [productId]);

  useEffect(() => {
    setIsClientMounted(true);
    const email = localStorage.getItem("currentUserEmail");
    const loggedIn = localStorage.getItem("isLoggedInPrototype") === "true";
    setCurrentUserEmail(email);
    setIsUserActuallyLoggedIn(loggedIn);
    if (loggedIn && email) {
        const storedProfileString = localStorage.getItem('userProfilePrototype');
        if (storedProfileString) {
            try {
                const storedProfile = JSON.parse(storedProfileString) as UserProfile;
                 setCurrentUserProfile(storedProfile);
            } catch (e) {
                console.error("Failed to parse user profile from localStorage", e);
                 setCurrentUserProfile(null); // Reset if parsing fails
            }
        } else {
             setCurrentUserProfile(null); // No profile in local storage
        }
    } else {
        setCurrentUserProfile(null); // Not logged in
    }
    fetchProductData();
  }, [fetchProductData, pathname]); // Re-check on navigation also re-fetches product for latest reviews.

  const handleReviewSubmit = async (values: ReviewFormValues) => {
    if (!isUserActuallyLoggedIn || !currentUserEmail || !currentUserProfile || !product) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit a review.", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);
    const reviewData: NewReviewData = {
      userEmail: currentUserEmail,
      userName: `${currentUserProfile.firstName} ${currentUserProfile.lastName}`.trim() || currentUserEmail.split('@')[0],
      rating: values.rating,
      comment: values.comment,
    };

    const result = await addProductReview(product.id, reviewData);
    if (result.success && result.product) {
      setProduct(result.product); // Update product state with new review and rating
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      reviewForm.reset();
    } else {
      toast({ title: "Submission Failed", description: result.error || "Could not submit your review.", variant: "destructive" });
    }
    setSubmittingReview(false);
  };


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
        <Separator />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-24 w-full" />
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUserActuallyLoggedIn) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
      return;
    }
    if (product.stock > 0) {
      addToCart(product, quantity);
    } else {
       setTimeout(() => {
        toast({
          title: "Out of Stock",
          description: `${product.name} is currently out of stock.`,
          variant: "destructive",
        });
      },0);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUserActuallyLoggedIn) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
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

  const StarRatingInput: React.FC<{ value: number; onChange: (rating: number) => void }> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={cn(
              "h-7 w-7 cursor-pointer transition-colors",
              (hoverValue || value) >= star
                ? "text-primary fill-primary"
                : "text-muted-foreground hover:text-primary/70"
            )}
          />
        ))}
      </div>
    );
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
              <div className="flex items-center">
                {Array(5).fill(0).map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${ i < Math.floor(product.rating || 0) ? "text-primary fill-primary" : "text-muted-foreground/50" }`}/>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({product.reviews || 0} reviews)</span>
              </div>
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
                  disabled={product.stock === 0 && isUserActuallyLoggedIn}
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
      
      {/* Reviews Section */}
      <section className="space-y-6">
        <h3 className="text-2xl font-semibold flex items-center">
          <MessageSquare className="mr-3 h-7 w-7 text-primary" /> Customer Reviews ({product.reviews || 0})
        </h3>

        {/* Add Review Form */}
        {isClientMounted && isUserActuallyLoggedIn && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Write a Review</CardTitle>
              <CardDescription>Share your thoughts about {product.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="rating" className="mb-2 block font-medium">Your Rating</Label>
                  <Controller
                    name="rating"
                    control={reviewForm.control}
                    render={({ field }) => <StarRatingInput value={field.value} onChange={field.onChange} />}
                  />
                  {reviewForm.formState.errors.rating && <p className="text-sm text-destructive mt-1">{reviewForm.formState.errors.rating.message}</p>}
                </div>
                <div>
                  <Label htmlFor="comment" className="font-medium">Your Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Tell us more about your experience..."
                    {...reviewForm.register("comment")}
                    className="mt-1"
                    rows={4}
                  />
                  {reviewForm.formState.errors.comment && <p className="text-sm text-destructive mt-1">{reviewForm.formState.errors.comment.message}</p>}
                </div>
                <Button type="submit" disabled={submittingReview}>
                  {submittingReview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Review <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
         {isClientMounted && !isUserActuallyLoggedIn && (
          <div className="text-center py-4 border rounded-md bg-muted/50">
            <p className="text-muted-foreground">
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="text-primary hover:underline font-medium">Log in</Link> to write a review.
            </p>
          </div>
        )}

        {/* Display Reviews */}
        {(product.productReviews && product.productReviews.length > 0) ? (
          <div className="space-y-4">
            {product.productReviews.map((review: Review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/40"}`}/>
                    ))}
                    <p className="ml-2 text-sm font-semibold text-foreground">{review.userName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(review.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No reviews yet for this product. Be the first to write one!</p>
        )}
      </section>


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

    