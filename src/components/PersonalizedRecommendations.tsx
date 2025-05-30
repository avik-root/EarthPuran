
"use client";

import { useEffect, useState } from 'react';
import { getProductRecommendations, type ProductRecommendationsOutput } from '@/ai/flows/product-recommendations';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, AlertCircle } from "lucide-react"; // Added AlertCircle
import { getProducts } from '@/app/actions/productActions'; // Import the server action

// Function to fetch full product details based on names from products.json
async function fetchProductsByNamesFromCatalog(names: string[]): Promise<Product[]> {
  if (!names || names.length === 0) {
    return [];
  }
  try {
    const allProducts = await getProducts(); // Fetch all products
    const foundProducts = allProducts.filter(p => names.includes(p.name));
    return foundProducts.slice(0, 3); // Limit to 3 recommendations for display
  } catch (error) {
    console.error("Failed to fetch products by names from catalog:", error);
    return [];
  }
}


export function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState<ProductRecommendationsOutput | null>(null);
  const [recommendedProductsDetails, setRecommendedProductsDetails] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError(null);
        // Mock user preferences and history for demonstration
        // The AI flow will ideally learn these over time or get them from user profile/activity
        const mockInput = {
          userPreferences: "Loves matte lipsticks and hydrating foundations. Prefers cruelty-free products from Earth Puran.",
          browsingHistory: "Viewed 'Velvet Matte Lipstick - Ruby Red' by Earth Puran, 'Silk Finish Primer' by Earth Puran, 'Organic Rosewater Toner' by Earth Puran",
          // The AI will suggest names. We then try to find these in products.json
          trendingProducts: "Radiant Glow Foundation, Midnight Sparkle Eyeshadow Palette, Volumizing Lash Mascara"
        };
        const result = await getProductRecommendations(mockInput);
        setRecommendations(result);
        if (result && result.recommendedProducts.length > 0) {
          // Fetch actual product details from products.json based on AI recommended names
          const productDetails = await fetchProductsByNamesFromCatalog(result.recommendedProducts);
          setRecommendedProductsDetails(productDetails);
        } else {
          setRecommendedProductsDetails([]);
        }
      } catch (e: any) {
        console.error("Failed to get recommendations:", e);
        if (e.message && e.message.includes("429")) {
          setError("Recommendations are temporarily unavailable due to high demand. Please try again in a few moments.");
        } else {
          setError("Could not load recommendations at this time.");
        }
        setRecommendedProductsDetails([]);
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive">Recommendations Unavailable</AlertTitle>
        <AlertDescription className="text-destructive/90">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!recommendations || recommendedProductsDetails.length === 0) {
    // Optionally, display a message if no relevant products are found or if AI returns no recommendations.
    // return <p className="text-muted-foreground">No special recommendations for you at this moment.</p>;
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-foreground">Just For You</h2>
      {recommendations.reasoning && (
         <Alert className="bg-primary/10 border-primary/30">
          <Lightbulb className="h-5 w-5 text-primary" />
          <AlertTitle className="text-primary">AI Recommendation Insights</AlertTitle>
          <AlertDescription className="text-foreground/80">
            {recommendations.reasoning}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
        {recommendedProductsDetails.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
