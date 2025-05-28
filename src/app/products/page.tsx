
import { getProducts } from "@/app/actions/productActions";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Filter, ListFilter } from "lucide-react";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Our Collection</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListFilter className="mr-2 h-4 w-4" /> Sort By
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
          <Button variant="outline" className="md:hidden">
             <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Filters Sidebar (Desktop) - Placeholder */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2 space-y-6 p-4 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold">Filters</h2>
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
            <h3 className="text-sm font-medium mb-2">Price Range</h3>
            {/* Price range slider or inputs here */}
            <p className="text-xs text-muted-foreground">Slider coming soon.</p>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-9 lg:col-span-10">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No products found.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back later!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
