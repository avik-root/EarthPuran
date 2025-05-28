
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const createAdminSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: passwordStrengthSchema,
  confirmPassword: z.string(),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const SALT_ROUNDS = 10; // For bcrypt

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [showCreatePin, setShowCreatePin] = useState(true);
  const [createPasswordStrength, setCreatePasswordStrength] = useState(0);
  
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(false); 
  
  const [hasMounted, setHasMounted] = useState(false);
  const [adminCredentialsConfigured, setAdminCredentialsConfigured] = useState(false);
  const [needsAccountCreation, setNeedsAccountCreation] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      if (localStorage.getItem("adminAccessGranted") !== "true") {
        router.push('/admin/access-gate');
      } else {
        const configured = localStorage.getItem("adminCredentialsConfigured") === "true";
        setAdminCredentialsConfigured(configured);
        setNeedsAccountCreation(!configured); // Show creation form if not configured
      }
    }
  }, [router]);

  const createAdminForm = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: "", 
      password: "",
      confirmPassword: "",
      loginPin: "",
    },
  });

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: typeof window !== 'undefined' ? localStorage.getItem("adminEmailPrototype") || "" : "", // Pre-fill if exists
      password: "",
      loginPin: "",
    },
  });
  
  const watchedCreatePassword = createAdminForm.watch("password");
  useEffect(() => {
    let strength = 0;
    if (watchedCreatePassword) {
      if (watchedCreatePassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(watchedCreatePassword)) strength += 25;
      if (/[0-9]/.test(watchedCreatePassword)) strength += 25;
      if (/[^A-Za-z0-9]/.test(watchedCreatePassword)) strength += 25;
    }
    setCreatePasswordStrength(strength);
  }, [watchedCreatePassword]);

  async function onCreateAdminSubmit(values: CreateAdminFormValues) {
    try {
      const hashedPassword = bcrypt.hashSync(values.password, SALT_ROUNDS);
      const hashedLoginPin = bcrypt.hashSync(values.loginPin, SALT_ROUNDS);

      localStorage.setItem("adminEmailPrototype", values.email);
      localStorage.setItem("adminPasswordHashPrototype", hashedPassword);
      localStorage.setItem("adminLoginPinHashPrototype", hashedLoginPin);
      localStorage.setItem("adminCredentialsConfigured", "true");
      
      setAdminCredentialsConfigured(true);
      setNeedsAccountCreation(false); // Switch to login form view
      adminLoginForm.setValue("email", values.email); // Pre-fill login form email

      toast({ title: "Admin Account Created", description: "Please log in with your new credentials." });
    } catch (error) {
      console.error("Admin account creation error:", error);
      toast({ title: "Creation Failed", description: "Could not create admin account.", variant: "destructive" });
    }
  }

  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (localStorage.getItem("adminAccessGranted") !== "true") {
      toast({ title: "Access Denied", description: "Please verify master access PIN first.", variant: "destructive" });
      router.push('/admin/access-gate');
      return;
    }
    if (!adminCredentialsConfigured) {
      toast({ title: "Setup Required", description: "Admin account needs to be created first.", variant: "destructive" });
      setNeedsAccountCreation(true);
      return;
    }

    const expectedEmail = localStorage.getItem("adminEmailPrototype");
    const expectedPasswordHash = localStorage.getItem("adminPasswordHashPrototype");
    const expectedLoginPinHash = localStorage.getItem("adminLoginPinHashPrototype");

    if (!expectedEmail || !expectedPasswordHash || !expectedLoginPinHash) {
      toast({ title: "Configuration Error", description: "Admin credentials not found. Please create an admin account.", variant: "destructive" });
      setNeedsAccountCreation(true);
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
      
      const adminProfileForStorage = {
          firstName: "Admin",
          lastName: "User",
          email: values.email,
      };
      localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

      toast({ title: "Admin Login Successful", description: "Welcome, Admin!" });
      const redirectUrl = searchParams.get('redirect') || "/admin/dashboard";
      router.push(redirectUrl);
    } else {
      toast({ title: "Admin Login Failed", description: "Invalid admin password or PIN.", variant: "destructive" });
    }
  }

  if (!hasMounted) {
    return null; // Or a loading skeleton
  }
  
  if (hasMounted && typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true") {
       // This part will be handled by AdminLayout's redirect in most cases,
       // but good to have a fallback here too.
      router.push('/admin/access-gate');
      return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        {needsAccountCreation ? (
          <>
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-12 w-12 text-primary mb-2" />
              <CardTitle className="text-3xl font-bold text-primary">Create Admin Account</CardTitle>
              <CardDescription>Set up the primary administrator credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createAdminForm}>
                <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-6">
                  <FormField
                    control={createAdminForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createAdminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showCreatePassword ? "text" : "password"} placeholder="Create a strong password" {...field} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowCreatePassword(!showCreatePassword)}
                              aria-label={showCreatePassword ? "Hide password" : "Show password"}
                            >
                              {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <Progress
                          value={createPasswordStrength}
                          className="h-2 mt-1"
                          indicatorClassName={cn({
                            'bg-red-500': createPasswordStrength > 0 && createPasswordStrength < 50,
                            'bg-yellow-500': createPasswordStrength >= 50 && createPasswordStrength < 75,
                            'bg-green-500': createPasswordStrength >= 75,
                          })}
                        />
                        <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createAdminForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showCreateConfirmPassword ? "text" : "password"} placeholder="Confirm your password" {...field} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowCreateConfirmPassword(!showCreateConfirmPassword)}
                            >
                              {showCreateConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createAdminForm.control}
                    name="loginPin"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>6-Digit Login PIN</FormLabel>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowCreatePin(!showCreatePin)}
                          >
                            {showCreatePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormControl>
                          <PinInput length={6} {...field} showPin={showCreatePin} />
                        </FormControl>
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
          </>
        ) : (
          <>
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
                        <FormControl>
                           {/* Make readOnly if pre-filled and configured, or allow typing */}
                          <Input placeholder="admin@example.com" {...field} />
                        </FormControl>
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
                            <Input type={showLoginPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                            >
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowLoginPin(!showLoginPin)}
                          >
                            {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormControl>
                          <PinInput length={6} {...field} showPin={showLoginPin} />
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
          </>
        )}
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

