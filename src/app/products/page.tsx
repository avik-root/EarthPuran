
"use client"; // Required for useState, useEffect

import { useEffect, useState } from "react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [searchTerm, setSearchTerm] = useState(""); // For search input

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0) {
        const prices = fetchedProducts.map(p => p.price);
        const newMinPrice = Math.min(...prices);
        const newMaxPrice = Math.max(...prices);
        setMinPrice(newMinPrice);
        setMaxPrice(newMaxPrice);
        setPriceRange([newMinPrice, newMaxPrice]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
  };

  // Placeholder for actual search and filter logic
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
    // && product.price >= priceRange[0] && product.price <= priceRange[1] // Price filtering (currently UI only)
  );

  const FilterOptions = () => (
    <div className="space-y-6 p-4">
        {/* <h2 className="text-lg font-semibold text-foreground">Filters</h2> */}
        <div>
          <h3 className="text-sm font-medium mb-2">Category</h3>
          <ul className="space-y-1 text-sm">
            <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">All</Button></li>
            <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">Makeup</Button></li>
            <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">Skincare</Button></li>
            <li><Button variant="link" className="p-0 h-auto text-muted-foreground hover:text-primary">Fragrance</Button></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">Price Range (₹)</h3>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Slider
                min={minPrice}
                max={maxPrice}
                step={100}
                value={priceRange}
                onValueChange={handlePriceChange}
                className="my-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Note: Product filtering by price is not yet active.</p>
            </>
          )}
        </div>
    </div>
  );


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-6">Our Collection</h1>
        
        {/* New Search and Filter Bar */}
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
                <DropdownMenuItem>Popularity</DropdownMenuItem>
                <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem>Newest</DropdownMenuItem>
                <DropdownMenuItem>Rating</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Filter Options</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)]"> {/* Adjust height if footer is added */}
                   <FilterOptions />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2 space-y-6 p-4 border rounded-lg bg-card h-fit sticky top-24">
           <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <FilterOptions />
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-9 lg:col-span-10">
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
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 xl:gap-x-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 col-span-full">
              <p className="text-xl text-muted-foreground">No products found matching "{searchTerm}".</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
