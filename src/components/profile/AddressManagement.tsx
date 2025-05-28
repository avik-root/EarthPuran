
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Placeholder for actual address data type
interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State/Province is required."),
  zipCode: z.string().min(1, "ZIP/Postal code is required."),
  country: z.string().min(1, "Country is required."),
  isDefault: z.boolean().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function AddressManagement() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]); // Initialize with empty array
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA", // Default country
      isDefault: false,
    },
  });

  useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
      setIsFormVisible(true);
    } else {
      form.reset({ street: "", city: "", state: "", zipCode: "", country: "USA", isDefault: false });
    }
  }, [editingAddress, form]);

  function onSubmit(values: AddressFormValues) {
    console.log("Address form submitted:", values);
    if (editingAddress) {
      // Update existing address
      setAddresses(addresses.map(addr => 
        addr.id === editingAddress.id ? { ...addr, ...values, isDefault: values.isDefault || false } : 
        (values.isDefault ? { ...addr, isDefault: false } : addr) // Unset other defaults if this one is set
      ));
      toast({ title: "Address Updated", description: "Your address has been successfully updated." });
    } else {
      // Add new address
      const newAddress = { ...values, id: Date.now().toString(), isDefault: values.isDefault || false };
       setAddresses(prev => values.isDefault ? 
        [...prev.map(a => ({...a, isDefault: false})), newAddress] :
        [...prev, newAddress]
      );
      toast({ title: "Address Added", description: "New address has been successfully added." });
    }
    setEditingAddress(null);
    setIsFormVisible(false);
    form.reset();
  }

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast({ title: "Address Deleted", description: "The address has been removed." });
  };
  
  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
     toast({ title: "Default Address Set", description: "Primary shipping address updated." });
  };

  return (
    <div className="space-y-6">
      {addresses.map((address) => (
        <Card key={address.id} className={cn("relative", address.isDefault && "border-primary ring-1 ring-primary")}>
          <CardContent className="p-4 space-y-1">
            <p className="font-semibold">{address.street}</p>
            <p>{address.city}, {address.state} {address.zipCode}</p>
            <p>{address.country}</p>
            {address.isDefault && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>
            )}
          </CardContent>
          <div className="absolute top-2 right-2 flex gap-1">
             {!address.isDefault && (
              <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>Set as Default</Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingAddress(address); setIsFormVisible(true); }}>
              <Edit3 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteAddress(address.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </Card>
      ))}

      {addresses.length === 0 && !isFormVisible && (
         <p className="text-muted-foreground text-center py-4">You haven&apos;t added any addresses yet.</p>
      )}

      <Button variant="outline" onClick={() => { setEditingAddress(null); setIsFormVisible(!isFormVisible); form.reset(); }} className="w-full sm:w-auto">
        <PlusCircle className="mr-2 h-4 w-4" /> {isFormVisible && !editingAddress ? "Cancel" : "Add New Address"}
      </Button>

      {isFormVisible && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{editingAddress ? "Edit Address" : "Add New Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St, Apt 4B" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="New York" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl><Input placeholder="NY" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP / Postal Code</FormLabel>
                        <FormControl><Input placeholder="10001" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl><Input placeholder="USA" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Set as default shipping address
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsFormVisible(false); setEditingAddress(null); form.reset();}}>Cancel</Button>
                  <Button type="submit">{editingAddress ? "Save Changes" : "Add Address"}</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
