
// src/app/admin/products/edit/[id]/page.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductById } from "@/app/actions/productActions"; 
import type { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  imageUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  imageHint: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const categories = ["Lips", "Face", "Eyes", "Skincare", "Tools", "Fragrance"];
const brands = ["Earth Puran"];

interface EditProductPageProps {
  params: { id: string };
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id: productId } = params;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

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
    },
  });

  useEffect(() => {
    async function fetchProductData() {
      setLoading(true);
      const fetchedProduct = await getProductById(productId); 
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        form.reset({
          name: fetchedProduct.name,
          description: fetchedProduct.description,
          price: fetchedProduct.price,
          category: fetchedProduct.category,
          brand: fetchedProduct.brand, // Should be "Earth Puran" from updated data
          stock: fetchedProduct.stock,
          imageUrl: fetchedProduct.imageUrl,
          imageHint: fetchedProduct.imageHint || "",
        });
      } else {
        console.error("Product not found");
      }
      setLoading(false);
    }
    if (productId) {
      fetchProductData();
    }
  }, [productId, form]);


  function onSubmit(values: ProductFormValues) {
    // TODO: Implement actual product update logic
    console.log("Updated product data for ID", productId, ":", values);
    // toast({ title: "Product Updated", description: `${values.name} has been updated.` });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4 mt-2" /></CardHeader>
          <CardContent className="space-y-8">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!product && !loading) {
     return (
       <div className="space-y-6 text-center">
         <h2 className="text-2xl font-semibold">Product Not Found</h2>
         <p>The product you are trying to edit does not exist.</p>
         <Button variant="outline" asChild>
            <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>
         </Button>
       </div>
     );
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
          <CardTitle>Edit Product: {product?.name || "Loading..."}</CardTitle>
          <CardDescription>Update the details for this Earth Puran product.</CardDescription>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>Image URL</FormLabel>
                    <FormControl><Input placeholder="https://placehold.co/600x600.png" {...field} /></FormControl>
                     <FormDescription>Use a placeholder like https://placehold.co/WIDTHxHEIGHT.png if needed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageHint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image AI Hint (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., lipstick beauty" {...field} /></FormControl>
                    <FormDescription>One or two keywords for AI image search (max 2 words).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/products">Cancel</Link>
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
