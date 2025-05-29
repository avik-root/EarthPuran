
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { UserAddress } from "@/types/userData";
import { getUserData, updateUserAddresses } from "@/app/actions/userActions";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      isDefault: false,
    },
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('currentUserEmail'));
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    if (!currentUserEmail) {
        setAddresses([]);
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    try {
      const userData = await getUserData(currentUserEmail);
      setAddresses(userData?.addresses || []);
    } catch (error) {
      console.error("Failed to load addresses:", error);
      setAddresses([]);
      toast({ title: "Error", description: "Could not load addresses.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserEmail, toast]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (editingAddress) {
      form.reset(editingAddress);
      setIsFormVisible(true);
    } else {
      form.reset({ street: "", city: "", state: "", zipCode: "", country: "India", isDefault: false });
    }
  }, [editingAddress, form]);


  async function onSubmit(values: AddressFormValues) {
    if (!currentUserEmail) {
        toast({ title: "Error", description: "You must be logged in to manage addresses.", variant: "destructive" });
        return;
    }

    let updatedAddresses: UserAddress[];
    const isNewAddress = !editingAddress;
    const newAddressId = Date.now().toString();

    if (editingAddress) {
      updatedAddresses = addresses.map(addr =>
        addr.id === editingAddress.id ? { ...addr, ...values, isDefault: values.isDefault || false } : addr
      );
    } else {
      const newAddress = { ...values, id: newAddressId, isDefault: values.isDefault || false };
      updatedAddresses = [...addresses, newAddress];
    }
    
    if (values.isDefault) {
        updatedAddresses = updatedAddresses.map(addr => 
            (addr.id === (editingAddress ? editingAddress.id : newAddressId))
            ? { ...addr, isDefault: true }
            : { ...addr, isDefault: false }
        );
    }
    
    if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
        updatedAddresses[0].isDefault = true;
    }

    try {
        const result = await updateUserAddresses(currentUserEmail, updatedAddresses);
        if (result) {
            setAddresses(updatedAddresses); 
            toast({ title: editingAddress ? "Address Updated" : "Address Added", description: `Your address has been successfully ${editingAddress ? "updated" : "added"}.` });
        } else {
             toast({ title: "Save Error", description: "Could not save address changes. Server indicated failure.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Failed to save addresses:", error);
        toast({ title: "Save Error", description: "Could not save address changes.", variant: "destructive" });
    }
    
    setEditingAddress(null);
    setIsFormVisible(false);
    form.reset();
  }

  const handleDeleteAddress = async (id: string) => {
    if (!currentUserEmail) return;
    let newAddresses = addresses.filter(addr => addr.id !== id);
    const deletedAddressWasDefault = addresses.find(addr => addr.id === id)?.isDefault;
    if (deletedAddressWasDefault && newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
    }

    try {
        const result = await updateUserAddresses(currentUserEmail, newAddresses);
         if (result) {
            setAddresses(newAddresses);
            toast({ title: "Address Deleted", description: "The address has been removed." });
        } else {
             toast({ title: "Delete Error", description: "Could not delete address. Server indicated failure.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Failed to delete address:", error);
        toast({ title: "Delete Error", description: "Could not delete address.", variant: "destructive" });
    }
  };
  
  const handleSetDefault = async (id: string) => {
    if (!currentUserEmail) return;
    const newAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    try {
        const result = await updateUserAddresses(currentUserEmail, newAddresses);
        if (result) {
            setAddresses(newAddresses);
            toast({ title: "Default Address Set", description: "Primary shipping address updated." });
        } else {
            toast({ title: "Update Error", description: "Could not set default address. Server indicated failure.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Failed to set default address:", error);
        toast({ title: "Update Error", description: "Could not set default address.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        <Skeleton className="h-10 w-1/3" />
      </div>
    )
  }

  if (!currentUserEmail && !isLoading) {
     return <p className="text-muted-foreground text-center py-4">Please log in to manage your addresses.</p>;
  }

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
        <PlusCircle className="mr-2 h-4 w-4" /> {isFormVisible && !editingAddress ? "Cancel Adding" : "Add New Address"}
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
                        <FormControl><Input placeholder="Mumbai" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="Maharashtra" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="400001" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="India" {...field} /></FormControl>
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
                            disabled={!!editingAddress && editingAddress.isDefault && addresses.length === 1}
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

    