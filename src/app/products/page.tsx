
"use client"; 

import { useEffect, useState, useMemo } from "react";
import { getProducts } from "@/app/actions/productActions";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Search, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type SortOption = "default" | "popularity" | "price-asc" | "price-desc" | "newest" | "rating";

// Moved FilterOptions outside to be a standalone component if needed, or keep inline
// For this refactor, keeping logic within ProductsPage for simplicity of state management initially

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");

  // Price range state for all products (to set slider limits)
  const [minProductPrice, setMinProductPrice] = useState(0);
  const [maxProductPrice, setMaxProductPrice] = useState(10000);

  // State for filters within the sheet (temporary before applying)
  const [sheetSelectedCategory, setSheetSelectedCategory] = useState<string | null>(null);
  const [sheetSelectedPriceRange, setSheetSelectedPriceRange] = useState<[number, number]>([0, 10000]);

  // State for applied filters
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 10000]);

  const [allCategories, setAllCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProductsData() {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      
      const uniqueCategories = Array.from(new Set(fetchedProducts.map(p => p.category)));
      setAllCategories(uniqueCategories);

      if (fetchedProducts.length > 0) {
        const prices = fetchedProducts.map(p => p.price);
        const newMinPrice = Math.min(...prices);
        const newMaxPrice = Math.max(...prices);
        setMinProductPrice(newMinPrice);
        setMaxProductPrice(newMaxPrice);
        
        // Initialize sheet and applied price ranges
        setSheetSelectedPriceRange([newMinPrice, newMaxPrice]);
        setAppliedPriceRange([newMinPrice, newMaxPrice]);
      } else {
        // Default ranges if no products
        setSheetSelectedPriceRange([0, 10000]);
        setAppliedPriceRange([0, 10000]);
      }
      setLoading(false);
    }
    fetchProductsData();
  }, []);

  const handleApplyFilters = () => {
    setAppliedCategory(sheetSelectedCategory);
    setAppliedPriceRange(sheetSelectedPriceRange);
    // SheetClose can be triggered programmatically if needed, or rely on user closing it
  };

  const handleClearFilters = () => {
    setSheetSelectedCategory(null);
    setSheetSelectedPriceRange([minProductPrice, maxProductPrice]);
    // Also apply these cleared filters immediately or require "Apply"
    setAppliedCategory(null);
    setAppliedPriceRange([minProductPrice, maxProductPrice]);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    // Filter by search term
    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (appliedCategory) {
      tempProducts = tempProducts.filter(product => product.category === appliedCategory);
    }

    // Filter by price range
    tempProducts = tempProducts.filter(product =>
      product.price >= appliedPriceRange[0] && product.price <= appliedPriceRange[1]
    );
    
    // Sort products
    switch (sortOption) {
      case "popularity": // Example: by reviews
        tempProducts.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case "price-asc":
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case "newest": // Example: by ID, higher ID is newer
        tempProducts.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case "rating":
        tempProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "default":
      default:
        // No specific sort or retain original order (or sort by ID asc)
        tempProducts.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        break;
    }

    return tempProducts;
  }, [products, searchTerm, appliedCategory, appliedPriceRange, sortOption]);

  const FilterOptionsComponent = () => (
    <div className="space-y-6 p-4">
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground">Category</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Button 
                variant="link" 
                className={`p-0 h-auto ${sheetSelectedCategory === null ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'}`}
                onClick={() => setSheetSelectedCategory(null)}
              >
                All
              </Button>
            </li>
            {allCategories.map(category => (
              <li key={category}>
                <Button 
                  variant="link" 
                  className={`p-0 h-auto ${sheetSelectedCategory === category ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-primary'}`}
                  onClick={() => setSheetSelectedCategory(category)}
                >
                  {category}
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground">Price Range (₹)</h3>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Slider
                min={minProductPrice}
                max={maxProductPrice}
                step={100} // Or a more dynamic step
                value={sheetSelectedPriceRange}
                onValueChange={(value) => setSheetSelectedPriceRange(value as [number, number])}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹{sheetSelectedPriceRange[0]}</span>
                <span>₹{sheetSelectedPriceRange[1]}</span>
              </div>
            </>
          )}
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-6">Our Collection</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg border bg-card shadow-sm mb-6">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              className="pl-10 pr-4 py-2 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Sort by <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption("default")}>Default</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("popularity")}>Popularity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-asc")}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-desc")}>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("newest")}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("rating")}>Rating</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Filter Options</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                   <FilterOptionsComponent />
                </ScrollArea>
                <SheetFooter className="p-4 border-t flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">Clear Filters</Button>
                  <SheetClose asChild>
                    <Button onClick={handleApplyFilters} className="w-full sm:w-auto">Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Main content area for products - No more desktop sidebar */}
      <main>
        {loading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-8">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 col-span-full">
            <p className="text-xl text-muted-foreground">No products found.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters!</p>
          </div>
        )}
      </main>
    </div>
  );
}

    