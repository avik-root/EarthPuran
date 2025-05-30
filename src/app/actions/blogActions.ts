
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { BlogPost, BlogPostFormData } from '@/types/blog';
import { revalidatePath } from 'next/cache';

const blogsFilePath = path.join(process.cwd(), 'src', 'data', 'blogs.json');

// Helper function to generate a URL-friendly slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/\s+/g, '-')    // Replace spaces with hyphens
    .replace(/-+/g, '-');   // Replace multiple hyphens with single hyphen
}

async function readBlogPostsFile(): Promise<BlogPost[]> {
  try {
    const jsonData = await fs.readFile(blogsFilePath, 'utf-8');
    if (!jsonData.trim()) {
      await fs.writeFile(blogsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    return JSON.parse(jsonData) as BlogPost[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      await fs.writeFile(blogsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("Failed to read blogs.json:", error);
    return [];
  }
}

async function writeBlogPostsFile(posts: BlogPost[]): Promise<void> {
  try {
    await fs.writeFile(blogsFilePath, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to blogs.json:", error);
    throw new Error("Could not save blog post data.");
  }
}

export async function getBlogPosts(onlyPublished: boolean = false): Promise<BlogPost[]> {
  const posts = await readBlogPostsFile();
  const sortedPosts = posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (onlyPublished) {
    return sortedPosts.filter(post => post.isPublished);
  }
  return sortedPosts;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readBlogPostsFile();
  const post = posts.find(p => p.slug === slug);
  return post && post.isPublished ? post : null; // Only return if published for public view
}

export async function getAdminBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readBlogPostsFile();
  const post = posts.find(p => p.slug === slug);
  return post || null; // Admin can view unpublished posts
}


export async function addBlogPost(
  formData: BlogPostFormData
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  if (!formData.title || !formData.content || !formData.authorName || !formData.category) {
    return { success: false, error: "Title, content, author, and category are required." };
  }

  try {
    const posts = await readBlogPostsFile();
    
    let slug = generateSlug(formData.title);
    let slugExists = posts.some(p => p.slug === slug);
    let suffix = 1;
    while (slugExists) {
      suffix++;
      slug = `${generateSlug(formData.title)}-${suffix}`;
      slugExists = posts.some(p => p.slug === slug);
    }

    const now = new Date().toISOString();
    const newPost: BlogPost = {
      ...formData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      slug,
      tags: formData.tagsString ? formData.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      createdAt: now,
      updatedAt: now,
      isPublished: formData.isPublished || false,
    };

    posts.push(newPost);
    await writeBlogPostsFile(posts);

    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/admin/blogs/new');
    // revalidatePath('/admin/blogs/manage'); // When manage page exists

    return { success: true, post: newPost };
  } catch (error) {
    console.error("Error adding blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not add blog post. ${errorMessage}` };
  }
}

// Placeholder for future update and delete actions
export async function updateBlogPost(
  slug: string,
  updateData: Partial<BlogPostFormData>
): Promise<{ success: boolean; post?: BlogPost; error?: string }> {
  // Implementation for updating a blog post
  // Remember to update 'updatedAt' and handle slug changes carefully if title is updated.
  // For now, let's assume slug doesn't change on update or title updates don't change slug.
  
  try {
    const posts = await readBlogPostsFile();
    const postIndex = posts.findIndex(p => p.slug === slug);

    if (postIndex === -1) {
      return { success: false, error: "Blog post not found." };
    }

    const existingPost = posts[postIndex];
    const updatedPost: BlogPost = {
      ...existingPost,
      ...updateData,
      tags: updateData.tagsString ? updateData.tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : existingPost.tags,
      updatedAt: new Date().toISOString(),
    };
    
    posts[postIndex] = updatedPost;
    await writeBlogPostsFile(posts);

    revalidatePath('/blog');
    revalidatePath(`/blog/${updatedPost.slug}`);
    // revalidatePath('/admin/blogs/manage');
    revalidatePath(`/admin/blogs/edit/${updatedPost.slug}`);


    return { success: true, post: updatedPost };

  } catch (error) {
    console.error("Error updating blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not update blog post. ${errorMessage}` };
  }
}

export async function deleteBlogPost(
  slug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let posts = await readBlogPostsFile();
    const initialLength = posts.length;
    posts = posts.filter(post => post.slug !== slug);

    if (posts.length === initialLength) {
      return { success: false, error: "Blog post not found." };
    }

    await writeBlogPostsFile(posts);
    revalidatePath('/blog');
    // revalidatePath('/admin/blogs/manage');

    return { success: true };
  } catch (error) {
    console.error("Error deleting blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not delete blog post. ${errorMessage}` };
  }
}

