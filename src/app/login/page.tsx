
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
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useToast } from "@/hooks/use-toast";
import { getUserData, initializeUserAccount } from "@/app/actions/userActions"; // To fetch profile data if needed
import type { UserProfile } from "@/types/userData";


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).refine(val => val.endsWith('@gmail.com'), { message: "Only Gmail addresses are allowed." }),
  password: z.string().min(1, { message: "Password is required." }), // In real app, compare with hashed password
  pin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }), // In real app, compare with hashed PIN
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(true); 

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

    // Prototype login logic:
    // For this prototype, we'll assume any valid email format with any password/pin is a successful login.
    // In a real app, you'd verify password and PIN against hashed stored values.
    
    let userProfileData: UserProfile | null = await getUserData(values.email);

    if (!userProfileData) {
      // If user data doesn't exist in users.json, create a basic profile.
      // This might happen if they signed up before users.json was implemented,
      // or it's a new "guest" login being converted.
      const newProfile: UserProfile = {
        firstName: values.email.split('@')[0] || "User", // Basic first name from email
        lastName: "",
        email: values.email,
        countryCode: "IN", // Default country
        phoneNumber: "0000000000", // Placeholder phone
      };
      try {
        userProfileData = await initializeUserAccount(newProfile); // Save to users.json
      } catch (error) {
        console.error("Failed to initialize user account on login:", error);
        toast({ title: "Login Error", description: "Could not retrieve or create user profile.", variant: "destructive" });
        return;
      }
    }
    
    localStorage.setItem("isLoggedInPrototype", "true");
    localStorage.setItem('userProfilePrototype', JSON.stringify(userProfileData)); // Store fetched or created profile
    localStorage.setItem('currentUserEmail', values.email); // Important for userActions

    toast({ title: "Login Successful", description: "Welcome back!" });
    const redirectUrl = searchParams.get('redirect') || "/";
    router.push(redirectUrl);
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your journey with Earth Puran.</CardDescription>
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
                Sign In
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
