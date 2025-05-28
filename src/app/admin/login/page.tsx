// src/app/admin/login/page.tsx
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/userData"; // For admin profile storage


const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const createAdminSchema = z.object({
  adminEmail: z.string().email({ message: "Invalid email address." }),
  adminPassword: passwordStrengthSchema,
  confirmAdminPassword: z.string(),
  adminLoginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
}).refine(data => data.adminPassword === data.confirmAdminPassword, {
  message: "Passwords don't match.",
  path: ["confirmAdminPassword"],
});

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const SALT_ROUNDS = 10;

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [needsAccountCreation, setNeedsAccountCreation] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      if (localStorage.getItem("adminAccessGranted") !== "true") {
        toast({ title: "Gate Access Required", description: "Please verify master access PIN first.", variant: "destructive" });
        router.push('/admin/access-gate');
      } else {
        const configured = localStorage.getItem("adminCredentialsConfigured") === "true";
        setNeedsAccountCreation(!configured);
      }
    }
    setLoadingConfig(false);
  }, [router, toast]);

  const createAdminForm = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      adminEmail: "",
      adminPassword: "",
      confirmAdminPassword: "",
      adminLoginPin: "",
    },
  });

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      loginPin: "",
    },
  });

  const watchedAdminPassword = createAdminForm.watch("adminPassword");
  useEffect(() => {
    let strength = 0;
    if (watchedAdminPassword) {
      if (watchedAdminPassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(watchedAdminPassword)) strength += 25;
      if (/[0-9]/.test(watchedAdminPassword)) strength += 25;
      if (/[^A-Za-z0-9]/.test(watchedAdminPassword)) strength += 25;
    }
    setPasswordStrength(strength);
  }, [watchedAdminPassword]);
  
  async function onCreateAdminSubmit(values: CreateAdminFormValues) {
    try {
      const hashedPassword = bcrypt.hashSync(values.adminPassword, SALT_ROUNDS);
      const hashedLoginPin = bcrypt.hashSync(values.adminLoginPin, SALT_ROUNDS);

      localStorage.setItem("adminEmailPrototype", values.adminEmail);
      localStorage.setItem("adminPasswordHashPrototype", hashedPassword);
      localStorage.setItem("adminLoginPinHashPrototype", hashedLoginPin);
      localStorage.setItem("adminCredentialsConfigured", "true");

      toast({ title: "Admin Account Created", description: "Please log in with your new admin credentials." });
      setNeedsAccountCreation(false); // Switch to login form
      adminLoginForm.setValue("email", values.adminEmail); // Pre-fill email for login
    } catch (error) {
      console.error("Admin creation error:", error);
      toast({ title: "Creation Failed", description: "Could not create admin account.", variant: "destructive" });
    }
  }
  
  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (localStorage.getItem("adminAccessGranted") !== "true") {
      toast({ title: "Access Denied", description: "Please verify master access PIN first.", variant: "destructive" });
      router.push('/admin/access-gate');
      return;
    }

    const expectedEmail = localStorage.getItem("adminEmailPrototype");
    const expectedPasswordHash = localStorage.getItem("adminPasswordHashPrototype");
    const expectedLoginPinHash = localStorage.getItem("adminLoginPinHashPrototype");

    if (!expectedEmail || !expectedPasswordHash || !expectedLoginPinHash) {
      toast({ title: "Configuration Error", description: "Admin credentials not found in local storage. Please create admin account if not done.", variant: "destructive" });
      setNeedsAccountCreation(true); // Force creation if not found
      return;
    }
    
    if (values.email !== expectedEmail) {
      toast({ title: "Admin Login Failed", description: "Invalid email for admin.", variant: "destructive" });
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, expectedPasswordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, expectedLoginPinHash);
    
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

      toast({ title: "Admin Login Successful", description: "Welcome, Admin!" });
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
      toast({ title: "Admin Login Failed", description: failureMessage, variant: "destructive" });
    }
  }

  if (!hasMounted || loadingConfig) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading Admin Configuration...</p>
            </div>
        </div>
    );
  }
  
  if (hasMounted && typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true") {
      // This part is mostly a fallback, AdminLayout should handle primary redirection
      router.push('/admin/access-gate');
      return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
      {needsAccountCreation ? (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-3xl font-bold text-primary">Create Admin Account</CardTitle>
            <CardDescription>Set up your administrator credentials. This is a one-time setup.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createAdminForm}>
              <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-6">
                <FormField
                  control={createAdminForm.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email Address</FormLabel>
                      <FormControl><Input placeholder="admin@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAdminForm.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <Progress value={passwordStrength} className="h-2 mt-1" indicatorClassName={cn({'bg-red-500': passwordStrength < 50, 'bg-yellow-500': passwordStrength >= 50 && passwordStrength < 75, 'bg-green-500': passwordStrength >= 75})} />
                      <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAdminForm.control}
                  name="confirmAdminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createAdminForm.control}
                  name="adminLoginPin"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>6-Digit Login PIN</FormLabel>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLoginPin(!showLoginPin)} aria-label={showLoginPin ? "Hide PIN" : "Show PIN"}>
                          {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <FormControl><PinInput length={6} {...field} showPin={showLoginPin} /></FormControl>
                      <FormDescription className="text-xs">This PIN will be used for admin login.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                  Create Admin Account
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
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
                      <FormLabel>Password</FormLabel>
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
                        <FormLabel>6-Digit Login PIN</FormLabel>
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
      )}
    </div>
  );
}
