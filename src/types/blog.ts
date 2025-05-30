
// src/types/blog.ts

export interface BlogPost {
  id: string; // Unique identifier
  slug: string; // URL-friendly identifier, generated from title
  title: string;
  content: string; // Markdown or HTML content
  excerpt: string; // Short summary
  imageUrl?: string; // Optional: URL for a featured image
  imageHint?: string; // Optional: Hint for AI image search for the featured image
  authorName: string; // Name of the author
  category: string; // e.g., "Tutorials", "Skincare", "Trends"
  tags?: string[]; // Optional: Array of tags
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isPublished: boolean; // Whether the post is visible to the public
  seoTitle?: string; // Optional: For SEO purposes
  seoDescription?: string; // Optional: For SEO purposes
}

export type BlogPostFormData = Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'> & {
  tagsString?: string; // For form input, to be converted to string[]
};
