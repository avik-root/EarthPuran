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
import bcrypt from 'bcryptjs';
import type { UserProfile } from "@/types/userData";
import adminCredentials from '@/data/admin.json';

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      if (localStorage.getItem("adminAccessGranted") !== "true") {
        setTimeout(() => {
          toast({ title: "Gate Access Required", description: "Please verify master access PIN first.", variant: "destructive" });
        }, 0);
        router.push('/admin/access-gate');
      }
    }
    setLoadingConfig(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); 

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: adminCredentials?.email || "", // Pre-fill if admin.json is loaded
      password: "",
      loginPin: "",
    },
  });
  
  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (localStorage.getItem("adminAccessGranted") !== "true") {
      setTimeout(() => {
        toast({ title: "Access Denied", description: "Please verify master access PIN first.", variant: "destructive" });
      }, 0);
      router.push('/admin/access-gate');
      return;
    }

    if (!adminCredentials || !adminCredentials.email || !adminCredentials.passwordHash || !adminCredentials.pinHash) {
      setTimeout(() => {
        toast({ title: "Configuration Error", description: "admin.json is missing or not configured correctly.", variant: "destructive", duration: 10000 });
      },0);
      return;
    }
    
    if (values.email !== adminCredentials.email) {
      setTimeout(() => {
        toast({ title: "Admin Login Failed", description: "Invalid email for admin.", variant: "destructive" });
      }, 0);
      return;
    }
    
    if (adminCredentials.passwordHash.startsWith("REPLACE_WITH_BCRYPT_HASH") || adminCredentials.pinHash.startsWith("REPLACE_WITH_BCRYPT_HASH")) {
      setTimeout(() => {
        toast({
          title: "Admin Configuration Incomplete",
          description: "Admin credentials in admin.json use placeholder hashes. Please generate and update them with actual bcrypt hashes.",
          variant: "destructive",
          duration: 15000, 
        });
      }, 0);
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, adminCredentials.passwordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, adminCredentials.pinHash);
    
    if (isPasswordCorrect && isPinCorrect) {
      localStorage.setItem("isLoggedInPrototype", "true");
      localStorage.setItem("isAdminPrototype", "true");
      localStorage.setItem('currentUserEmail', values.email); 
      
      const adminProfileForStorage: UserProfile = {
          firstName: "Admin",
          lastName: "User",
          email: values.email,
          countryCode: "IN", 
          phoneNumber: "0000000000",
      };
      localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

      setTimeout(() => {
        toast({ title: "Admin Login Successful", description: "Welcome, Admin!" });
      }, 0);
      const redirectUrl = searchParams.get('redirect') || "/admin/dashboard";
      router.push(redirectUrl);
    } else {
      let failureMessage = "Invalid admin credentials.";
      if (!isPasswordCorrect && !isPinCorrect) {
        failureMessage = "Invalid admin password and PIN.";
      } else if (!isPasswordCorrect) {
        failureMessage = "Invalid admin password.";
      } else if (!isPinCorrect) {
        failureMessage = "Invalid admin PIN.";
      }
      setTimeout(() => {
        toast({ title: "Admin Login Failed", description: failureMessage, variant: "destructive" });
      }, 0);
    }
  }

  if (!hasMounted || loadingConfig) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading Admin Login...</p>
            </div>
        </div>
    );
  }
  
  if (hasMounted && typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true") {
      router.push('/admin/access-gate');
      return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl font-bold text-primary">Admin Panel Login</CardTitle>
            <CardDescription>Enter your administrator credentials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...adminLoginForm}>
              <form onSubmit={adminLoginForm.handleSubmit(onAdminLoginSubmit)} className="space-y-6">
                <FormField
                  control={adminLoginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email Address</FormLabel>
                      <FormControl><Input placeholder="admin@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminLoginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={adminLoginForm.control}
                  name="loginPin"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Admin 6-Digit Login PIN</FormLabel>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLoginPin(!showLoginPin)} aria-label={showLoginPin ? "Hide PIN" : "Show PIN"}>
                          {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormControl><PinInput length={6} {...field} showPin={showLoginPin} /></FormControl>
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
