// src/app/admin/login/page.tsx
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import adminCredentials from '@/data/admin.json';
import bcrypt from 'bcryptjs';

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  pin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false); 
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      // Check if gate PIN was entered
      if (localStorage.getItem("adminAccessGranted") !== "true") {
        router.push('/admin/access-gate');
        return; // Stop further execution if gate not passed
      }

      // If gate passed and already logged in as admin, redirect to dashboard
      if (localStorage.getItem("isLoggedInPrototype") === "true" && localStorage.getItem("isAdminPrototype") === "true") {
        router.push(searchParams.get('redirect') || "/admin/dashboard");
      }
    }
  }, [hasMounted, searchParams, router]);

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: adminCredentials.email, 
      password: "",
      pin: "",
    },
  });

  async function onSubmit(values: AdminLoginFormValues) {
    if (localStorage.getItem("adminAccessGranted") !== "true") {
      toast({ title: "Access Denied", description: "Please verify access PIN first.", variant: "destructive" });
      router.push('/admin/access-gate');
      return;
    }

    if (values.email !== adminCredentials.email) {
      toast({ title: "Admin Login Failed", description: "Invalid email for admin.", variant: "destructive" });
      return;
    }

    let isPasswordCorrect = false;
    let isPinCorrect = false;

    if (adminCredentials.password.startsWith('$2a$') || adminCredentials.password.startsWith('$2b$')) {
      isPasswordCorrect = bcrypt.compareSync(values.password, adminCredentials.password);
    } else {
      isPasswordCorrect = values.password === adminCredentials.password; 
    }

    if (adminCredentials.pin.startsWith('$2a$') || adminCredentials.pin.startsWith('$2b$')) {
       isPinCorrect = bcrypt.compareSync(values.pin, adminCredentials.pin);
    } else {
      isPinCorrect = values.pin === adminCredentials.pin; 
    }
    
    if (isPasswordCorrect && isPinCorrect) {
      localStorage.setItem("isLoggedInPrototype", "true");
      localStorage.setItem("isAdminPrototype", "true");
      localStorage.setItem('currentUserEmail', values.email); 
      
      const adminProfileForStorage = {
          firstName: "Admin",
          lastName: "User",
          email: values.email,
      };
      localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

      toast({ title: "Admin Login Successful", description: "Welcome, Admin!" });
      const redirectUrl = searchParams.get('redirect') || "/admin/dashboard";
      router.push(redirectUrl);
      return;
    } else {
      toast({ title: "Admin Login Failed", description: "Invalid admin password or PIN.", variant: "destructive" });
      return;
    }
  }

  if (!hasMounted) {
    return null; 
  }
  
  // If mounted but gate not passed, this will be caught by useEffect and redirect.
  // This check is a fallback for the brief moment before useEffect runs.
  if (hasMounted && typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true") {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl text-destructive flex items-center justify-center gap-2">
                        <ShieldAlert className="h-8 w-8" /> Gate Access Required
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">You must pass the security PIN gate first.</p>
                    <Button asChild>
                        <Link href="/admin/access-gate">Go to Access Gate</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">Admin Panel Access</CardTitle>
          <CardDescription>Please enter your administrator credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} readOnly className="bg-muted/50" />
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
                Log In as Admin
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 mt-4">
          <Button variant="link" asChild className="text-sm text-muted-foreground">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
