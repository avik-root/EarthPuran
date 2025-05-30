
"use server";

import fs from 'fs/promises';
import path from 'path';
import type { BlogPost, BlogPostFormData } from '@/types/blog';
import { revalidatePath } from 'next/cache';

const blogsFilePath = path.join(process.cwd(), 'src', 'data', 'blogs.json');

// Helper function to generate a URL-friendly slug from a title
function generateSlug(title: string): string {
  let slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters except spaces and hyphens
    .replace(/\s+/g, '-')    // Replace spaces with hyphens
    .replace(/-+/g, '-');   // Replace multiple hyphens with single hyphen
  
  // Ensure slug is not empty and doesn't consist only of hyphens
  if (!slug || slug.replace(/-/g, '') === '') {
    // Fallback to a unique slug based on timestamp if title results in empty/meaningless slug
    return `post-${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
  }
  return slug;
}

async function readBlogPostsFile(): Promise<BlogPost[]> {
  try {
    const jsonData = await fs.readFile(blogsFilePath, 'utf-8');
    if (!jsonData.trim()) {
      // If the file is empty, initialize with an empty array and write it back
      await fs.writeFile(blogsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    return JSON.parse(jsonData) as BlogPost[];
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      // If file doesn't exist, create it with an empty array
      await fs.writeFile(blogsFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("Failed to read blogs.json:", error);
    // In case of other errors (e.g., parse error), return empty or throw
    // For robustness, returning empty array for this prototype.
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
    // Check if a post with this exact slug already exists
    let slugExists = posts.some(p => p.slug === slug);
    let suffix = 1;
    const baseSlug = slug; // Keep the original generated slug for appending suffix
    while (slugExists) {
      suffix++;
      slug = `${baseSlug}-${suffix}`;
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
    
    // If title changed, slug might need to be regenerated, ensure uniqueness
    if (updateData.title && updateData.title !== existingPost.title) {
      let newSlug = generateSlug(updateData.title);
      if (newSlug !== existingPost.slug) { // Only update if different
        let slugExists = posts.some(p => p.slug === newSlug && p.id !== existingPost.id);
        let suffix = 1;
        const baseSlug = newSlug;
        while (slugExists) {
          suffix++;
          newSlug = `${baseSlug}-${suffix}`;
          slugExists = posts.some(p => p.slug === newSlug && p.id !== existingPost.id);
        }
        updatedPost.slug = newSlug;
      }
    }


    posts[postIndex] = updatedPost;
    await writeBlogPostsFile(posts);

    revalidatePath('/blog');
    if(existingPost.slug !== updatedPost.slug) {
      revalidatePath(`/blog/${existingPost.slug}`); // Revalidate old path
    }
    revalidatePath(`/blog/${updatedPost.slug}`); // Revalidate new/current path
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
    revalidatePath(`/blog/${slug}`); // Revalidate the deleted post's path
    // revalidatePath('/admin/blogs/manage');

    return { success: true };
  } catch (error) {
    console.error("Error deleting blog post:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: `Could not delete blog post. ${errorMessage}` };
  }
}

