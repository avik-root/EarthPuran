
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, UserCircle } from "lucide-react";

// Sample blog post data
const blogPosts = [
  {
    id: "1",
    title: "The Ultimate Guide to Flawless Foundation Application",
    excerpt: "Achieve a perfect, airbrushed look with our step-by-step guide to foundation application. Learn tips and tricks from the pros.",
    imageUrl: "https://placehold.co/800x500.png",
    imageHint: "makeup tutorial",
    author: "Earth Puran Experts",
    date: "October 26, 2023",
    category: "Tutorials"
  },
  {
    id: "2",
    title: "Top 5 Skincare Ingredients You Need in Your Routine",
    excerpt: "Unlock radiant skin by incorporating these powerhouse ingredients into your daily skincare regimen. We break down the benefits of each.",
    imageUrl: "https://placehold.co/800x500.png",
    imageHint: "skincare products",
    author: "Dr. Eva Chen",
    date: "October 15, 2023",
    category: "Skincare"
  },
  {
    id: "3",
    title: "Seasonal Makeup Trends: Fall 2023 Edition",
    excerpt: "Discover the hottest makeup looks for this fall. From bold lips to smokey eyes, get inspired to update your beauty game.",
    imageUrl: "https://placehold.co/800x500.png",
    imageHint: "fall makeup",
    author: "Beauty Insider",
    date: "September 28, 2023",
    category: "Trends"
  }
];

export default function BlogPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Earth Puran Beauty Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Your source for beauty inspiration, tips, tutorials, and the latest trends in natural makeup and skincare.
        </p>
      </div>

      {/* Featured Post - can be the latest or a pinned one */}
      {blogPosts.length > 0 && (
        <Card className="overflow-hidden shadow-lg">
          <Link href={`/blog/${blogPosts[0].id}`}>
            <div className="md:flex">
              <div className="md:w-1/2">
                <Image
                  src={blogPosts[0].imageUrl}
                  alt={blogPosts[0].title}
                  width={800}
                  height={500}
                  className="w-full h-64 md:h-full object-cover"
                  data-ai-hint={blogPosts[0].imageHint}
                />
              </div>
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                <CardHeader className="p-0">
                  <span className="text-sm text-primary font-medium mb-1">{blogPosts[0].category}</span>
                  <CardTitle className="text-2xl md:text-3xl font-bold hover:text-primary transition-colors">{blogPosts[0].title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mt-3">
                  <CardDescription className="text-base leading-relaxed">{blogPosts[0].excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="p-0 mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" /> {blogPosts[0].author}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> {blogPosts[0].date}
                  </div>
                </CardFooter>
              </div>
            </div>
          </Link>
        </Card>
      )}
      
      {/* Blog Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.slice(1).map((post) => ( // Display remaining posts
          <Card key={post.id} className="overflow-hidden flex flex-col group">
            <Link href={`/blog/${post.id}`}>
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={600}
                height={375}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={post.imageHint}
              />
            </Link>
            <CardHeader>
              <span className="text-xs text-primary font-medium">{post.category}</span>
              <CardTitle className="text-xl font-semibold leading-tight">
                <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-sm line-clamp-3">{post.excerpt}</CardDescription>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground flex items-center justify-between">
              <span>By {post.author}</span>
              <span>{post.date}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {blogPosts.length === 0 && (
        <p className="text-center text-muted-foreground py-10 text-lg">
          No blog posts yet. Check back soon for beauty insights!
        </p>
      )}
    </div>
  );
}
