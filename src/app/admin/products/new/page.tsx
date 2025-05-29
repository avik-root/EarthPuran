
// src/app/admin/products/new/page.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  imageUrl: z.string().url("Must be a valid URL for the primary image.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
  additionalImageUrlsString: z.string().optional(), // For textarea input
  colors: z.array(z.object({
    name: z.string().min(1, "Color name is required."),
    link: z.string().url({ message: "Must be a valid URL if provided." }).optional().or(z.literal('')),
    image: z.string().url({ message: "Must be a valid URL if provided." }).optional().or(z.literal('')),
  })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const categories = ["Lips", "Face", "Eyes", "Skincare", "Tools", "Fragrance"];
const brands = ["Earth Puran"];

export default function NewProductPage() {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      brand: "Earth Puran",
      stock: 0,
      imageUrl: "",
      imageHint: "",
      additionalImageUrlsString: "",
      colors: [],
    },
  });

  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  function onSubmit(values: ProductFormValues) {
    const additionalImageUrls = values.additionalImageUrlsString
      ? values.additionalImageUrlsString.split('\n').map(url => url.trim()).filter(url => url && z.string().url().safeParse(url).success)
      : [];

    const processedValues = {
      ...values,
      additionalImageUrls: additionalImageUrls,
    };
    delete (processedValues as any).additionalImageUrlsString;

    console.log("New product data:", processedValues);
    toast({ title: "Product Created (Simulated)", description: `${values.name} has been added. (Data logged to console)` });
    // form.reset(); // Uncomment to clear form after submission
  }

  return (
    <div className="space-y-6">
       <Button variant="outline" asChild className="mb-4">
        <Link href="/admin/products">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Fill in the details for the new Earth Puran product.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Velvet Matte Lipstick" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Detailed product description..." {...field} rows={5} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl><Input type="number" step="0.01" placeholder="2800.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {brands.map(br => <SelectItem key={br} value={br}>{br}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Image URL</FormLabel>
                    <FormControl><Input placeholder="https://your-drive-link/image.png" {...field} /></FormControl>
                    <FormDescription>Enter a direct link to the primary product image (e.g., from Google Drive).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Image AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., lipstick beauty" {...field} /></FormControl>
                    <FormDescription>One or two keywords for AI image search (max 2 words).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalImageUrlsString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Image URLs (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Enter one URL per line for additional images..." {...field} rows={4} /></FormControl>
                    <FormDescription>Provide direct links to other product images, each on a new line.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <div>
                <FormLabel className="text-lg font-medium">Color Variants</FormLabel>
                <FormDescription className="mb-4">Add specific links or images for different color variants of this product.</FormDescription>
                {colorFields.map((field, index) => (
                  <Card key={field.id} className="mb-4 p-4 space-y-3 relative">
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeColor(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Remove color variant</span>
                      </Button>
                    <FormField
                      control={form.control}
                      name={`colors.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Ruby Red" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`colors.${index}.link`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link for this Color (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://example.com/product/item-red" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`colors.${index}.image`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL for this Color (Optional)</FormLabel>
                          <FormControl><Input placeholder="https://your-drive-link/image-red.png" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendColor({ name: "", link: "", image: "" })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Color Variant
                </Button>
              </div>
              <Separator />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/products">Cancel</Link>
                </Button>
                <Button type="submit">Save Product</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
