
// src/app/admin/blogs/new/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Save, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Link from "next/link";
import { addBlogPost } from "@/app/actions/blogActions";
import { useRouter } from "next/navigation";

const blogPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  content: z.string().min(50, "Content must be at least 50 characters."),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters.").max(200, "Excerpt too long (max 200 chars)."),
  authorName: z.string().min(2, "Author name is required."),
  category: z.string().min(1, "Category is required."),
  tagsString: z.string().optional(), // Comma-separated
  imageUrl: z.string().url("Must be a valid URL for the featured image.").optional().or(z.literal('')),
  imageHint: z.string().max(20, "Hint too long (max 20 chars).").refine(val => !val || val.split(' ').length <= 2, {message: "Max 2 words for hint."}).optional(),
  isPublished: z.boolean().default(false),
  seoTitle: z.string().max(70, "SEO Title too long (max 70 chars).").optional(),
  seoDescription: z.string().max(160, "SEO Description too long (max 160 chars).").optional(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

export default function WriteNewBlogPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("Earth Puran Admin"); // Default

  useEffect(() => {
    // Attempt to get admin's name if available from localStorage (e.g., from admin login)
    const storedProfileString = localStorage.getItem('userProfilePrototype');
    if (storedProfileString) {
      try {
        const profile = JSON.parse(storedProfileString);
        if (profile.firstName) {
          setCurrentUserDisplayName(`${profile.firstName} ${profile.lastName || ''}`.trim());
        }
      } catch (e) { console.error("Could not parse admin profile for blog author name", e); }
    }
  }, []);


  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      content: "",
      excerpt: "",
      authorName: currentUserDisplayName,
      category: "",
      tagsString: "",
      imageUrl: "",
      imageHint: "",
      isPublished: false,
      seoTitle: "",
      seoDescription: "",
    },
  });
  
  // Update default authorName if currentUserDisplayName changes after initial render
  useEffect(() => {
    form.setValue("authorName", currentUserDisplayName);
  }, [currentUserDisplayName, form]);


  async function onSubmit(values: BlogPostFormValues) {
    setIsSubmitting(true);
    
    const blogPostDataForAction = {
      ...values,
      tags: values.tagsString ? values.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };
    
    const result = await addBlogPost(blogPostDataForAction);

    if (result.success && result.post) {
      toast({ title: "Blog Post Created", description: `"${result.post.title}" has been successfully created.` });
      form.reset();
      // Optionally redirect to manage page or the new post
      router.push("/admin/blogs/new"); // For now, stay on new page, could redirect to /admin/blogs/manage later
    } else {
      toast({ title: "Failed to Create Post", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Write New Blog Post</h1>
            </div>
            {/* Add a "Manage Blogs" button later if needed */}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a New Blog Entry</CardTitle>
          <CardDescription>Fill in the details for your new blog post.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="My Awesome Blog Post" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea placeholder="Write your blog content here. You can use Markdown for formatting..." {...field} rows={10} /></FormControl>
                  <FormDescription>Markdown is supported for basic formatting (e.g., # H1, ## H2, *italic*, **bold**, [link](url)).</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="excerpt" render={({ field }) => (
                <FormItem><FormLabel>Excerpt (Summary)</FormLabel><FormControl><Textarea placeholder="A short summary of your post..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="authorName" render={({ field }) => (
                    <FormItem><FormLabel>Author Name</FormLabel><FormControl><Input placeholder="e.g., Earth Puran Team" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Skincare Tips" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="tagsString" render={({ field }) => (
                <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., natural, organic, tips" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Featured Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="imageHint" render={({ field }) => (
                  <FormItem><FormLabel>Featured Image AI Hint (Optional)</FormLabel><FormControl><Input placeholder="e.g., skincare routine" {...field} /></FormControl><FormDescription>One or two keywords for AI image search (max 2 words).</FormDescription><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="isPublished" render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>Publish Post</FormLabel>
                        <FormDescription>Make this post visible to the public immediately upon saving.</FormDescription>
                    </div>
                  </FormItem>
              )} />

              <div>
                <h3 className="text-lg font-medium mb-2">SEO Settings (Optional)</h3>
                <div className="space-y-4 p-4 border rounded-md">
                    <FormField control={form.control} name="seoTitle" render={({ field }) => (
                        <FormItem><FormLabel>SEO Title</FormLabel><FormControl><Input placeholder="Custom title for search engines" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="seoDescription" render={({ field }) => (
                        <FormItem><FormLabel>SEO Meta Description</FormLabel><FormControl><Textarea placeholder="Custom description for search engines" {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                 <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                   <Link href="/admin/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Save Post"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
