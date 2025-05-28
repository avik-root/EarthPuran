
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; 
import { useToast } from "@/hooks/use-toast";
import { getUserData, initializeUserAccount } from "@/app/actions/userActions"; 
import type { UserData, UserProfile } from "@/types/userData";
import adminCredentials from '@/data/admin.json';


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).refine(val => val.endsWith('@gmail.com'), { message: "Only Gmail addresses are allowed." }),
  password: z.string().min(1, { message: "Password is required." }), 
  pin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }), 
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(true); 
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      if (localStorage.getItem("isLoggedInPrototype") === "true") {
        router.push(searchParams.get('redirect') || "/");
      }
    }
  }, [hasMounted, searchParams, router, pathname]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      pin: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    console.log("Login form submitted:", values);
    
    // Admin Login Check
    if (values.email === adminCredentials.email) {
      if (values.password === adminCredentials.password && values.pin === adminCredentials.pin) {
        localStorage.setItem("isLoggedInPrototype", "true");
        localStorage.setItem("isAdminPrototype", "true");
        localStorage.setItem('currentUserEmail', values.email);
        const adminProfileForStorage: UserProfile = { // Simplified profile for admin for localStorage
            firstName: "Admin", 
            lastName: "User", 
            email: values.email, 
            countryCode: "IN", 
            phoneNumber: "0000000000",
            password_plaintext_prototype_only: adminCredentials.password, // For consistency if profile is ever fully displayed
            pin_plaintext_prototype_only: adminCredentials.pin,
        };
        localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

        toast({ title: "Admin Login Successful", description: "Welcome, Admin!" });
        const redirectUrl = searchParams.get('redirect') || "/admin/dashboard";
        router.push(redirectUrl);
         if (redirectUrl === pathname) router.refresh();
        return;
      } else {
        toast({ title: "Login Failed", description: "Invalid admin credentials. Please check your password and PIN.", variant: "destructive" });
        return;
      }
    }

    // Regular User Login
    let userData: UserData | null = null;
    try {
      userData = await getUserData(values.email);
    } catch (e) {
      console.error("Error fetching user data for login:", e);
      toast({ title: "Login Error", description: "An error occurred while trying to log you in. Please try again.", variant: "destructive" });
      return;
    }

    if (!userData) {
      toast({ title: "Login Failed", description: "User not found. Please sign up if you don't have an account.", variant: "destructive" });
      return;
    }

    // Validate password and PIN for regular user
    // IMPORTANT: This is comparing plaintext for prototype purposes. NEVER do this in production.
    if (userData.profile.password_plaintext_prototype_only !== values.password || 
        userData.profile.pin_plaintext_prototype_only !== values.pin) {
      toast({ title: "Login Failed", description: "Invalid credentials. Please check your email, password, and PIN.", variant: "destructive" });
      return;
    }
    
    localStorage.setItem("isLoggedInPrototype", "true");
    localStorage.setItem("isAdminPrototype", "false"); 
    localStorage.setItem('currentUserEmail', values.email);
    localStorage.setItem('userProfilePrototype', JSON.stringify(userData.profile));


    toast({ title: "Login Successful", description: "Welcome back!" });
    const redirectUrl = searchParams.get('redirect') || "/";
    router.push(redirectUrl);
    if (redirectUrl === pathname) {
        router.refresh(); 
    }
  }
  
  if (!hasMounted) {
    return null; 
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Log in to continue your journey with Earth Puran.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Gmail only)</FormLabel>
                    <FormControl>
                      <Input placeholder="yourname@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>6-Digit PIN</FormLabel>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowPin(!showPin)}
                          aria-label={showPin ? "Hide PIN" : "Show PIN"}
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <FormControl>
                      <PinInput
                        length={6}
                        value={field.value}
                        onChange={field.onChange}
                        name={field.name}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        showPin={showPin}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                Log In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Button variant="link" asChild className="text-sm text-muted-foreground">
            <Link href="/forgot-password">Forgot Password or PIN?</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
