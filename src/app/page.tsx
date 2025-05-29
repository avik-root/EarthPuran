
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { PersonalizedRecommendations } from "@/components/PersonalizedRecommendations";
import { getFeaturedProducts } from "@/app/actions/productActions";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const newArrivals = await getFeaturedProducts(4); // This now fetches newest products

  const shopCategories = [
    { name: "Makeup", href: "/products?category=Makeup", image: "https://placehold.co/300x200.png", imageHint: "makeup collection", description: "Explore our vibrant range of makeup essentials." },
    { name: "Skincare", href: "/products?category=Skincare", image: "https://placehold.co/300x200.png", imageHint: "skincare products", description: "Nourish your skin with our natural skincare line." },
    { name: "Haircare", href: "/products?category=Haircare", image: "https://placehold.co/300x200.png", imageHint: "haircare items", description: "Revitalize your hair with Earth Puran's best." },
    { name: "Fragrance", href: "/products?category=Fragrance", image: "https://placehold.co/300x200.png", imageHint: "perfume display", description: "Discover your signature scent from our collection." },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-lg overflow-hidden bg-gradient-to-r from-rose-50 via-stone-50 to-pink-50 dark:from-rose-900/30 dark:via-stone-900/30 dark:to-pink-900/30 p-8 md:p-16 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
            Purely You. Naturally Radiant.
          </h1>
          <p className="text-lg text-foreground/80">
            Discover Earth Puran's curated collection of natural and organic beauty products, designed to enhance your natural radiance. All products are exclusively from Earth Puran.
          </p>
          <Button asChild size="lg" className="group bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/products">
              Shop Collection
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center md:justify-end">
          <Image
            src="https://placehold.co/500x500.png"
            alt="Natural and organic beauty products by Earth Puran"
            width={500}
            height={500}
            className="rounded-lg shadow-2xl"
            data-ai-hint="natural beauty lifestyle"
            priority
          />
        </div>
      </section>

      {/* New Arrivals Section (Previously Featured Products) */}
      {newArrivals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">New Arrivals</h2>
            <Button variant="link" asChild className="text-primary hover:text-primary/80">
              <Link href="/products?sort=newest">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Personalized Recommendations Section */}
      <section>
        <PersonalizedRecommendations />
      </section>

      {/* Call to Action / Category Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "New Arrivals", href: "/products?sort=newest", image: "https://placehold.co/400x300.png", imageHint: "new cosmetics" },
          { title: "Skincare Essentials", href: "/products?category=skincare", image: "https://placehold.co/400x300.png", imageHint: "skincare routine" },
          { title: "Best Sellers", href: "/products?sort=popular", image: "https://placehold.co/400x300.png", imageHint: "popular makeup" },
        ].map(item => (
          <Link href={item.href} key={item.title} className="group relative rounded-lg overflow-hidden shadow-lg block">
            <Image src={item.image} alt={item.title} width={400} height={300} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={item.imageHint} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
              <h3 className="text-2xl font-semibold text-white group-hover:text-primary transition-colors">{item.title}</h3>
            </div>
          </Link>
        ))}
      </section>

      {/* Shop by Category Section */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shopCategories.map((category) => (
            <Card key={category.name} className="overflow-hidden group flex flex-col">
              <Link href={category.href} className="block">
                <Image 
                  src={category.image} 
                  alt={category.name} 
                  width={300} 
                  height={200} 
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={category.imageHint}
                />
              </Link>
              <CardHeader>
                <CardTitle className="text-xl">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80">
                  <Link href={category.href}>
                    Explore {category.name}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Beauty Blog Teaser */}
      <section className="text-center py-12 bg-secondary/30 dark:bg-secondary/20 rounded-lg">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">From Our Beauty Blog</h2>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-foreground/80">
          Get inspired with the latest trends, tips, and tutorials from our beauty experts.
        </p>
        <Button asChild variant="outline" size="lg" className="mt-6 hover:bg-primary hover:text-primary-foreground">
          <Link href="/blog">Read More</Link>
        </Button>
      </section>
    </div>
  );
}
