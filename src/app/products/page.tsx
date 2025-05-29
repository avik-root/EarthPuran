
"use client"; 

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
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
import { Filter, Search, ChevronDown, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

type SortOption = "default" | "popularity" | "price-asc" | "price-desc" | "newest" | "rating";

const RATING_OPTIONS = [
  { value: "any", label: "Any Rating" },
  { value: "4", label: "4 Stars & Up" },
  { value: "3", label: "3 Stars & Up" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams(); // Get search params

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest"); 

  const [minProductPrice, setMinProductPrice] = useState(0);
  const [maxProductPrice, setMaxProductPrice] = useState(10000);

  // State for filters within the sheet
  const [sheetSelectedCategory, setSheetSelectedCategory] = useState<string | null>(null);
  const [sheetSelectedPriceRange, setSheetSelectedPriceRange] = useState<[number, number]>([0, 10000]);
  const [sheetSelectedRating, setSheetSelectedRating] = useState<string>("any");
  const [sheetSelectedTags, setSheetSelectedTags] = useState<string[]>([]);
  const [sheetFilterSearchTerm, setSheetFilterSearchTerm] = useState("");

  // State for applied filters
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [appliedPriceRange, setAppliedPriceRange] = useState<[number, number]>([0, 10000]);
  const [appliedRating, setAppliedRating] = useState<string>("any");
  const [appliedTags, setAppliedTags] = useState<string[]>([]);

  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProductsData() {
      setLoading(true);
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      
      const uniqueCategories = Array.from(new Set(fetchedProducts.map(p => p.category)));
      setAllCategories(uniqueCategories);

      const uniqueTags = Array.from(new Set(fetchedProducts.flatMap(p => p.tags || [])));
      setAllTags(uniqueTags.sort());

      if (fetchedProducts.length > 0) {
        const prices = fetchedProducts.map(p => p.price);
        const newMinPrice = Math.floor(Math.min(...prices));
        const newMaxPrice = Math.ceil(Math.max(...prices));
        setMinProductPrice(newMinPrice);
        setMaxProductPrice(newMaxPrice);
        
        // Initialize price range for sheet and applied filters
        setSheetSelectedPriceRange([newMinPrice, newMaxPrice]);
        setAppliedPriceRange([newMinPrice, newMaxPrice]);
      } else {
        setSheetSelectedPriceRange([0, 10000]);
        setAppliedPriceRange([0, 10000]);
      }

      // Check for category in URL search params
      const categoryFromUrl = searchParams.get('category');
      if (categoryFromUrl && uniqueCategories.includes(categoryFromUrl)) {
        setSheetSelectedCategory(categoryFromUrl);
        setAppliedCategory(categoryFromUrl);
      }
      
      // Check for sort option in URL search params
      const sortFromUrl = searchParams.get('sort') as SortOption;
      if (sortFromUrl && ["default", "popularity", "price-asc", "price-desc", "newest", "rating"].includes(sortFromUrl)) {
        setSortOption(sortFromUrl);
      }


      setLoading(false);
    }
    fetchProductsData();
  }, [searchParams]); // Rerun when searchParams change

  const handleApplyFilters = () => {
    setAppliedCategory(sheetSelectedCategory);
    setAppliedPriceRange(sheetSelectedPriceRange);
    setAppliedRating(sheetSelectedRating);
    setAppliedTags(sheetSelectedTags);
  };

  const handleClearFilters = () => {
    setSheetSelectedCategory(null);
    setSheetSelectedPriceRange([minProductPrice, maxProductPrice]);
    setSheetSelectedRating("any");
    setSheetSelectedTags([]);
    setSheetFilterSearchTerm("");

    setAppliedCategory(null);
    setAppliedPriceRange([minProductPrice, maxProductPrice]);
    setAppliedRating("any");
    setAppliedTags([]);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    if (searchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (appliedCategory) {
      tempProducts = tempProducts.filter(product => product.category === appliedCategory);
    }

    tempProducts = tempProducts.filter(product =>
      product.price >= appliedPriceRange[0] && product.price <= appliedPriceRange[1]
    );

    if (appliedRating !== "any") {
      const minRating = parseInt(appliedRating);
      tempProducts = tempProducts.filter(product => (product.rating || 0) >= minRating);
    }
    
    if (appliedTags.length > 0) {
      tempProducts = tempProducts.filter(product => 
        appliedTags.every(tag => product.tags?.includes(tag))
      );
    }
    
    switch (sortOption) {
      case "popularity":
        tempProducts.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
      case "price-asc":
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        tempProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      case "default":
      default:
        tempProducts.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }

    return tempProducts;
  }, [products, searchTerm, appliedCategory, appliedPriceRange, appliedRating, appliedTags, sortOption]);

  const FilterOptionsComponent = () => {
    const filteredCategories = allCategories.filter(cat => cat.toLowerCase().includes(sheetFilterSearchTerm.toLowerCase()));
    const filteredTags = allTags.filter(tag => tag.toLowerCase().includes(sheetFilterSearchTerm.toLowerCase()));

    return (
    <div className="space-y-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search filters..." 
            className="pl-10 text-sm"
            value={sheetFilterSearchTerm}
            onChange={(e) => setSheetFilterSearchTerm(e.target.value)}
          />
           {sheetFilterSearchTerm && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSheetFilterSearchTerm('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground">Category</h3>
          <RadioGroup value={sheetSelectedCategory || "all"} onValueChange={(val) => setSheetSelectedCategory(val === "all" ? null : val)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="cat-all" />
              <Label htmlFor="cat-all" className="text-base sm:text-sm font-normal">All</Label>
            </div>
            {filteredCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={`cat-${category}`} />
                <Label htmlFor={`cat-${category}`} className="text-base sm:text-sm font-normal">{category}</Label>
              </div>
            ))}
            {filteredCategories.length === 0 && sheetFilterSearchTerm && <p className="text-xs text-muted-foreground">No categories match your search.</p>}
          </RadioGroup>
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
                step={Math.max(1, Math.floor((maxProductPrice - minProductPrice) / 100))}
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
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground">Rating</h3>
          <RadioGroup value={sheetSelectedRating} onValueChange={setSheetSelectedRating}>
            {RATING_OPTIONS.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`rating-${option.value}`} />
                <Label htmlFor={`rating-${option.value}`} className="text-base sm:text-sm font-normal">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-2 text-foreground">Tags</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredTags.map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tag-${tag}`} 
                  checked={sheetSelectedTags.includes(tag)}
                  onCheckedChange={(checked) => {
                    setSheetSelectedTags(prev => 
                      checked ? [...prev, tag] : prev.filter(t => t !== tag)
                    );
                  }}
                />
                <Label htmlFor={`tag-${tag}`} className="text-base sm:text-sm font-normal">{tag}</Label>
              </div>
            ))}
            {filteredTags.length === 0 && sheetFilterSearchTerm && <p className="text-xs text-muted-foreground">No tags match your search.</p>}
             {allTags.length === 0 && <p className="text-xs text-muted-foreground">No tags available for filtering.</p>}
          </div>
        </div>
    </div>
  )};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-6">Our Collection</h1>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg border bg-card shadow-sm mb-6">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name..."
              className="pl-10 pr-4 py-2 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  Sort by <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOption("newest")}>Newest</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("popularity")}>Popularity</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-asc")}>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("price-desc")}>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("rating")}>Rating</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto text-sm">
                  <Filter className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-lg">Filter Options</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                   <FilterOptionsComponent />
                </ScrollArea>
                <SheetFooter className="p-4 border-t flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto text-sm">Clear Filters</Button>
                  <SheetClose asChild>
                    <Button onClick={handleApplyFilters} className="w-full sm:w-auto text-sm">Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
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
    

    
