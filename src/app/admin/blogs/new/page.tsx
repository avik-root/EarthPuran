
// src/app/admin/blogs/new/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Construction } from "lucide-react";

export default function WriteNewBlogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Write New Blog Post</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5 text-muted-foreground" />
            Feature Under Development
          </CardTitle>
          <CardDescription>
            The ability to create and publish blog posts is coming soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will provide a rich text editor and options for managing your blog content, including categories, tags, featured images, and SEO settings.
            Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
