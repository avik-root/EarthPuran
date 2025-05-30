
// src/app/blog/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, UserCircle } from "lucide-react";
import { getBlogPosts } from "@/app/actions/blogActions";
import type { BlogPost } from "@/types/blog";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function BlogPostsList() {
  const blogPosts: BlogPost[] = await getBlogPosts(true); // Fetch only published posts

  if (!blogPosts || blogPosts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10 text-lg col-span-full">
        No blog posts yet. Check back soon for beauty insights!
      </div>
    );
  }

  return (
    <>
      {/* Featured Post - can be the latest or a pinned one */}
      {blogPosts.length > 0 && (
        <Card className="overflow-hidden shadow-lg mb-12 col-span-1 md:col-span-2 lg:col-span-3">
          <Link href={`/blog/${blogPosts[0].slug}`}>
            <div className="md:flex">
              <div className="md:w-1/2">
                <Image
                  src={blogPosts[0].imageUrl || "https://placehold.co/800x500.png"}
                  alt={blogPosts[0].title}
                  width={800}
                  height={500}
                  className="w-full h-64 md:h-full object-cover"
                  data-ai-hint={blogPosts[0].imageHint || "blog featured"}
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
                    <UserCircle className="h-4 w-4" /> {blogPosts[0].authorName}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> {new Date(blogPosts[0].createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </CardFooter>
              </div>
            </div>
          </Link>
        </Card>
      )}
      
      {/* Remaining Blog Posts Grid */}
      {blogPosts.slice(1).map((post) => (
        <Card key={post.id} className="overflow-hidden flex flex-col group">
          <Link href={`/blog/${post.slug}`}>
            <Image
              src={post.imageUrl || "https://placehold.co/600x375.png"}
              alt={post.title}
              width={600}
              height={375}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={post.imageHint || "blog article"}
            />
          </Link>
          <CardHeader>
            <span className="text-xs text-primary font-medium">{post.category}</span>
            <CardTitle className="text-xl font-semibold leading-tight">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription className="text-sm line-clamp-3">{post.excerpt}</CardDescription>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground flex items-center justify-between">
            <span>By {post.authorName}</span>
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}

function BlogPostsListSkeleton() {
  return (
    <>
      <Card className="overflow-hidden shadow-lg mb-12 col-span-1 md:col-span-2 lg:col-span-3">
        <div className="md:flex">
          <Skeleton className="md:w-1/2 w-full h-64 md:h-[400px]" />
          <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-3">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-16 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </Card>
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="overflow-hidden flex flex-col group">
          <Skeleton className="w-full h-48" />
          <CardHeader>
            <Skeleton className="h-3 w-1/5 mb-1" />
            <Skeleton className="h-6 w-4/5" />
          </CardHeader>
          <CardContent className="flex-grow">
            <Skeleton className="h-12 w-full" />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground flex items-center justify-between">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </>
  );
}


export default function BlogPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Earth Puran Beauty Blog</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Your source for beauty inspiration, tips, tutorials, and the latest trends in natural makeup and skincare.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Suspense fallback={<BlogPostsListSkeleton />}>
          <BlogPostsList />
        </Suspense>
      </div>
    </div>
  );
}

