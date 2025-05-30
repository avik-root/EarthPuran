
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Lock, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Order, ShippingDetails as OrderShippingDetails } from "@/types/order";
import type { UserProfile, UserAddress } from "@/types/userData";
import { getUserData, addOrder } from "@/app/actions/userActions";
import { getTaxRate } from "@/app/actions/taxActions"; // Import tax action

const countries: { code: string; name: string; phoneCode: string }[] = [
  { code: "US", name: "United States", phoneCode: "+1" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", phoneCode: "+44" },
  { code: "AU", name: "Australia", phoneCode: "+61" },
  { code: "IN", name: "India", phoneCode: "+91" },
];

const shippingSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  address: z.string().min(5, "Street address is required."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State is required."),
  pincode: z.string().min(5, "Pincode is required.").regex(/^\d{5,6}$/, "Invalid pincode format."),
  country: z.string().min(1, "Country is required."),
  phoneNumber: z.string().min(10, "Phone number must be 10 digits.").max(10, "Phone number must be 10 digits.").regex(/^\d+$/, "Phone number must be numeric."),
  phoneCountryCode: z.string().optional(),
});

export type ShippingFormValues = z.infer<typeof shippingSchema>;

const DEFAULT_TAX_RATE_PERCENTAGE = 18; // Fallback default

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, clearCart, isLoadingCart, refreshCart } = useCart();
  const { toast } = useToast();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [shippingDetailsSaved, setShippingDetailsSaved] = useState<ShippingFormValues | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [taxRatePercentage, setTaxRatePercentage] = useState<number>(DEFAULT_TAX_RATE_PERCENTAGE);
  const [isLoadingTaxRate, setIsLoadingTaxRate] = useState(true);

  const shippingCost = cartItems.length > 0 ? 50.00 : 0;
  // Assuming no coupons on checkout page directly, subtotal is pre-discount
  const taxAmount = cartItems.length > 0 && !isLoadingTaxRate ? subtotal * (taxRatePercentage / 100) : 0;
  const totalAmount = subtotal + taxAmount + shippingCost;


  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phoneNumber: "",
      phoneCountryCode: "+91",
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('currentUserEmail');
      setCurrentUserEmail(email);
      if (!email) { 
        toast({title: "Login Required", description: "Please log in to proceed to checkout.", variant:"destructive"});
        router.push("/login?redirect=/checkout");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast]); 

  const fetchCurrentTaxRate = useCallback(async () => {
    setIsLoadingTaxRate(true);
    try {
        const taxData = await getTaxRate();
        setTaxRatePercentage(taxData.rate);
    } catch (error) {
        console.error("Failed to fetch tax rate:", error);
        setTaxRatePercentage(DEFAULT_TAX_RATE_PERCENTAGE); // Fallback
        toast({ title: "Tax Rate Error", description: "Could not load tax rate, using default.", variant: "destructive" });
    } finally {
        setIsLoadingTaxRate(false);
    }
  }, [toast]);

  const loadInitialData = useCallback(async () => {
    if (!currentUserEmail) {
        setLoadingProfile(false);
        return;
    }
    setLoadingProfile(true);
    try {
        const userData = await getUserData(currentUserEmail);
        let profileToUse: UserProfile | null = null;
        let defaultAddressToUse: UserAddress | null = null;

        if (userData) {
            profileToUse = userData.profile;
            if (userData.addresses && userData.addresses.length > 0) {
                defaultAddressToUse = userData.addresses.find(addr => addr.isDefault) || userData.addresses[0];
            }
        } else {
            const storedProfile = localStorage.getItem('userProfilePrototype'); 
            if (storedProfile) profileToUse = JSON.parse(storedProfile) as UserProfile;
        }

        const countryInfo = countries.find(c => c.code === profileToUse?.countryCode);

        form.reset({
            firstName: profileToUse?.firstName || "",
            lastName: profileToUse?.lastName || "",
            phoneNumber: profileToUse?.phoneNumber || "",
            phoneCountryCode: countryInfo?.phoneCode || "+91",
            country: defaultAddressToUse?.country || countryInfo?.name || "India",
            address: defaultAddressToUse?.street || "",
            city: defaultAddressToUse?.city || "",
            state: defaultAddressToUse?.state || "",
            pincode: defaultAddressToUse?.zipCode || "",
        });
    } catch (error) {
        console.error("Failed to load user data for checkout:", error);
        toast({title: "Error", description: "Could not load your profile data.", variant: "destructive"})
    } finally {
        setLoadingProfile(false);
    }
  }, [currentUserEmail, form, toast]);

  useEffect(() => {
    if(currentUserEmail){ 
        loadInitialData();
        refreshCart(); 
        fetchCurrentTaxRate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail, loadInitialData, fetchCurrentTaxRate]); 


  const onShippingSubmit = (values: ShippingFormValues) => {
    console.log("Shipping details saved:", values);
    setShippingDetailsSaved(values);
    toast({ title: "Shipping Address Saved", description: "You can now proceed to place your order." });
  };

  const handlePlaceOrder = async () => {
    if (!currentUserEmail) {
        toast({ title: "Login Required", description: "Please log in to place an order.", variant: "destructive" });
        router.push("/login?redirect=/checkout");
        return;
    }
    if (!shippingDetailsSaved || cartItems.length === 0) {
      toast({
        title: "Cannot Place Order",
        description: "Please save your shipping address and ensure your cart is not empty.",
        variant: "destructive",
      });
      return;
    }

    const orderShippingDetails: OrderShippingDetails = {
        firstName: shippingDetailsSaved.firstName,
        lastName: shippingDetailsSaved.lastName,
        address: shippingDetailsSaved.address,
        city: shippingDetailsSaved.city,
        state: shippingDetailsSaved.state,
        pincode: shippingDetailsSaved.pincode,
        country: shippingDetailsSaved.country,
        phoneNumber: shippingDetailsSaved.phoneNumber,
        phoneCountryCode: shippingDetailsSaved.phoneCountryCode,
    };

    const newOrder: Order = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB'),
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
        imageHint: item.product.imageHint,
      })),
      totalAmount: totalAmount, // This totalAmount now includes tax
      shippingDetails: orderShippingDetails,
      status: 'Processing',
    };

    try {
      const success = await addOrder(currentUserEmail, newOrder);
      if (!success) throw new Error("Failed to add order via action.");
      await clearCart(); 

      toast({
        title: "Order Placed Successfully!",
        description: "Your Earth Puran order (COD) has been confirmed. Thank you for shopping!",
      });
      router.push("/");
    } catch (error) {
      console.error("Failed to save order:", error);
      toast({
        title: "Order Placement Issue",
        description: "There was an issue saving your order. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push('/cart')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Secure Checkout</h1>
        </div>
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <p className="text-muted-foreground text-center md:text-left">Complete your purchase quickly and securely.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Where should we send your Earth Puran goodies?</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl><Input placeholder="123 Beauty Lane, Apt 4B" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl><Input placeholder="Mumbai" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl><Input placeholder="Maharashtra" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="pincode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl><Input placeholder="400001" {...field} type="tel" maxLength={6} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                     <FormField control={form.control} name="country" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormField control={form.control} name="phoneCountryCode" render={({ field }) => (
                             <FormControl><Input {...field} readOnly className="w-20 bg-muted"/></FormControl>
                        )}/>
                        <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                            <FormControl><Input type="tel" placeholder="9876543210" {...field} maxLength={10} /></FormControl>
                        )}/>
                      </div>
                       <FormMessage>{form.formState.errors.phoneNumber?.message || form.formState.errors.phoneCountryCode?.message}</FormMessage>
                    </FormItem>
                    <Button type="submit" className="w-full md:w-auto">Save Shipping Address</Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-primary">Cash on Delivery (COD)</p>
              <p className="text-sm text-muted-foreground mt-1">
                This is currently the only payment method available. You can pay in cash when your order is delivered.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-primary" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingCart || isLoadingTaxRate ? (
                <Skeleton className="h-24 w-full" />
              ) : cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Your cart is empty.</p>
              ) : (
                <>
                  <ScrollArea className="h-[200px] pr-3">
                    <ul className="space-y-3 text-sm">
                      {cartItems.map(item => (
                        <li key={item.product.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p>₹{(item.product.price * item.quantity).toFixed(2)}</p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                  <Separator />
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span>Tax ({taxRatePercentage}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span>Shipping</span><span>₹{shippingCost.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                size="lg"
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={!shippingDetailsSaved || cartItems.length === 0 || loadingProfile || isLoadingCart || isLoadingTaxRate}
              >
                Place Order (COD)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
