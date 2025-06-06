
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
import { getUserData } from "@/app/actions/userActions";
import type { UserData } from "@/types/userData";
import bcrypt from 'bcryptjs';


const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).refine(val => val.toLowerCase().endsWith('@gmail.com'), { message: "Only Gmail addresses are allowed." }),
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
  const [showPin, setShowPin] = useState(false); 
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      if (localStorage.getItem("isLoggedInPrototype") === "true") {
        // If already logged in, redirect unless on an admin page redirect from admin layout
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl && redirectUrl.startsWith('/admin')) {
          // Let admin layout handle if user is admin or not
        } else {
          router.push(redirectUrl || "/");
        }
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
    const normalizedEmail = values.email.toLowerCase();

    let userData: UserData | null = null;
    try {
      userData = await getUserData(normalizedEmail);
    } catch (e) {
      console.error("Error fetching user data for login:", e);
      setTimeout(() => {
        toast({ title: "Login Error", description: "An error occurred while trying to log you in. Please try again.", variant: "destructive" });
      },0);
      return;
    }

    if (!userData || !userData.profile.hashedPassword || !userData.profile.hashedPin) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "User not found or credentials not set up. Please sign up if you don't have an account.", variant: "destructive" });
      },0);
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, userData.profile.hashedPassword);
    const isPinCorrect = bcrypt.compareSync(values.pin, userData.profile.hashedPin);

    if (!isPasswordCorrect || !isPinCorrect) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "Invalid credentials. Please check your email, password, and PIN.", variant: "destructive" });
      },0);
      return;
    }
    
    // Set admin status based on user data from users.json (this will be false unless explicitly set, first user is no longer admin by default)
    if (userData.profile.isAdmin) {
      localStorage.setItem("isAdminPrototype", "true");
    } else {
      localStorage.setItem("isAdminPrototype", "false");
    }

    localStorage.setItem("isLoggedInPrototype", "true");
    localStorage.setItem('currentUserEmail', normalizedEmail); 
    localStorage.setItem('userProfilePrototype', JSON.stringify(userData.profile));


    setTimeout(() => {
      toast({ title: "Login Successful", description: "Welcome back!" });
    },0);
    const redirectUrl = searchParams.get('redirect') || "/"; // Regular users go to home
    router.push(redirectUrl);
    if (redirectUrl === pathname) { 
        router.refresh();
    }
  }

  if (!hasMounted) {
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Log In</CardTitle>
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
                      <Input placeholder="example@gmail.com" {...field} />
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

