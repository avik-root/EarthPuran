
// src/app/blog/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug, getBlogPosts } from "@/app/actions/blogActions";
import type { BlogPost } from "@/types/blog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, UserCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Helper function to render markdown (basic implementation)
// For a more robust solution, consider libraries like 'marked' or 'react-markdown'
function renderMarkdown(markdown: string) {
  // Basic replacements - extend as needed
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-extrabold my-5">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>') // Bold
    .replace(/\*(.*)\*/gim, '<em>$1</em>')           // Italic
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>') // Links
    .replace(/^\s*-\s+(.*)/gim, '<li class="ml-4 my-1">$1</li>') // Basic list items
    .replace(/(<li>.*<\/li>\s*)+/gim, (match) => `<ul class="list-disc list-inside my-3">${match}</ul>`); // Wrap LIs in UL

  // Paragraphs - wrap lines that aren't already part of other HTML elements
  html = html.split('\n').map(line => {
    if (line.trim() === '' || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li') || line.startsWith('<a')) {
      return line;
    }
    return `<p class="my-3 leading-relaxed text-foreground/90">${line}</p>`;
  }).join('');

  return { __html: html };
}


export async function generateStaticParams() {
  const posts = await getBlogPosts(true); // Fetch only published posts for static generation
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: "Post Not Found",
    };
  }
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        images: post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : [],
    }
  };
}


export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post: BlogPost | null = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
        </Link>
      </Button>

      <article>
        <header className="space-y-4 mb-8">
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full rounded-lg shadow-lg object-cover aspect-video"
              data-ai-hint={post.imageHint || "blog post header"}
              priority
            />
          )}
          <Badge variant="secondary" className="text-sm">{post.category}</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
            {post.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              <span>By {post.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <Separator className="my-8" />

        {/* Basic Markdown Rendering */}
        <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={renderMarkdown(post.content)} />


        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary"/> Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Consider adding related posts section here */}
    </div>
  );
}
