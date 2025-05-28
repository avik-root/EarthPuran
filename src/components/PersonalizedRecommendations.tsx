
"use client";

import { useEffect, useState } from 'react';
import { getProductRecommendations, type ProductRecommendationsOutput } from '@/ai/flows/product-recommendations';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb } from "lucide-react";

// Mock function to fetch full product details based on names
// In a real app, this would query your product database/API
async function fetchProductsByNames(names: string[]): Promise<Product[]> {
  // This is a placeholder. You'd need to implement logic to fetch actual product data.
  // For now, returning mock products branded as Earth Puran.
  const mockProducts: Product[] = [
    { id: "rec1", name: "Velvet Matte Lipstick", category: "Lips", brand: "Earth Puran", price: 28.00, description: "Recommended for you! From Earth Puran.", imageUrl: "https://placehold.co/600x600.png", imageHint: "lipstick beauty", stock: 10, rating: 4.5, reviews: 10 },
    { id: "rec2", name: "Radiant Glow Foundation", category: "Face", brand: "Earth Puran", price: 45.00, description: "A great match based on your history. From Earth Puran.", imageUrl: "https://placehold.co/600x600.png", imageHint: "foundation makeup", stock: 10, rating: 4.8, reviews: 15 },
    { id: "rec3", name: "Midnight Sparkle Eyeshadow Palette", category: "Eyes", brand: "Earth Puran", price: 55.00, description: "Users like you loved this! From Earth Puran.", imageUrl: "https://placehold.co/600x600.png", imageHint: "eyeshadow palette", stock: 10, rating: 4.7, reviews: 20 },
  ];
  return mockProducts.filter(p => names.includes(p.name)).slice(0,3);
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
        const mockInput = {
          userPreferences: "Loves matte lipsticks and hydrating foundations. Prefers cruelty-free products from Earth Puran.",
          browsingHistory: "Viewed 'Velvet Matte Lipstick - Ruby Red' by Earth Puran, 'Silk Finish Primer' by Earth Puran, 'Organic Rosewater Toner' by Earth Puran",
          trendingProducts: "Radiant Glow Foundation, Midnight Sparkle Eyeshadow Palette, Volumizing Lash Mascara" // These names will be matched against Earth Puran products by fetchProductsByNames
        };
        const result = await getProductRecommendations(mockInput);
        setRecommendations(result);
        if (result && result.recommendedProducts.length > 0) {
          const productDetails = await fetchProductsByNames(result.recommendedProducts);
          setRecommendedProductsDetails(productDetails);
        }
      } catch (e) {
        console.error("Failed to get recommendations:", e);
        setError("Could not load recommendations at this time.");
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
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recommendations || recommendedProductsDetails.length === 0) {
    return null; // Or a message like "No recommendations for you yet!"
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
