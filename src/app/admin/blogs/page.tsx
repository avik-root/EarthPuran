"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Blog {
  id: string;
  title: string;
  // Add other blog properties as needed (e.g., author, date, content preview)
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    // In a real application, you would fetch data from an API route
    // that reads src/data/blogs.json. For this example, we'll simulate it.
    const fetchBlogs = async () => {
      // Replace with actual fetch from your API route
      const response = await fetch("/api/admin/blogs"); // Assuming you create this API route
      const data = await response.json();
      setBlogs(data);
    };
    fetchBlogs();
  }, []);

  const handleDelete = (id: string) => {
    // Implement delete functionality here
    console.log("Delete blog with ID:", id);
    // In a real application, you would send a request to your API route
    // to delete the blog from src/data/blogs.json and then update the state
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Manage Blogs</h1>
      <Link href="/admin/blogs/new">
        <Button className="mb-4">Create New Blog</Button>
      </Link>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            {/* Add other table headers for blog properties */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell className="font-medium">{blog.title}</TableCell>
              {/* Add other table cells for blog properties */}
              <TableCell className="text-right">
                <Link href={`/admin/blogs/edit/${blog.id}`}>
                  <Button variant="outline" size="sm" className="mr-2">
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(blog.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}