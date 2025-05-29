
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
import adminCredentialsData from '@/data/admin.json'; // Rename import to avoid conflict

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Define a schema for the initial admin setup form
const initialAdminSetupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  loginPin: z.string().length(6, { message: "PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});
type InitialAdminSetupFormValues = z.infer<typeof initialAdminSetupSchema>;

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false); // State for login form password
  const [showLoginPin, setShowLoginPin] = useState(true); // Default to showing PIN
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
  }, [router, toast]); 

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: adminCredentialsData?.email || "", // Pre-fill if admin.json is loaded
      password: "",
      loginPin: "",
    },
  });

  // Form for initial admin setup
  const initialAdminSetupForm = useForm<InitialAdminSetupFormValues>({
    resolver: zodResolver(initialAdminSetupSchema),
    defaultValues: {
      email: "",
      password: "",
      loginPin: "",
    },
  });
  
  // State to control which form is displayed
  const [showSetupForm, setShowSetupForm] = useState(false);

  // Check if admin config is valid (exists and has proper hashes, not placeholders)
  const isConfigValid = adminCredentialsData && 
                       adminCredentialsData.email && 
                       adminCredentialsData.passwordHash && 
                       adminCredentialsData.pinHash &&
                       !adminCredentialsData.passwordHash.startsWith("REPLACE_WITH_BCRYPT_HASH") && 
                       !adminCredentialsData.pinHash.startsWith("REPLACE_WITH_BCRYPT_HASH");

  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (localStorage.getItem("adminAccessGranted") !== "true") {
      toast({ title: "Access Denied", description: "Please verify master access PIN first.", variant: "destructive" });
      router.push('/admin/access-gate');
      return;
    }

    if (!isConfigValid) {
      setTimeout(() => {
        toast({ title: "Configuration Error", description: "admin.json is missing or not configured correctly.", variant: "destructive", duration: 10000 });
      },0);
      return;
    }
    
    if (values.email !== adminCredentials.email) {
      toast({ title: "Admin Login Failed", description: "Invalid email for admin.", variant: "destructive" });
      return;
    }
    
    // Assuming adminCredentialsData is the imported object.
    // If it's not loaded correctly or is undefined, isConfigValid check should catch it.
    // However, for type safety and clarity, let's use adminCredentialsData explicitly.
    const adminCredentials = adminCredentialsData as { email: string; passwordHash: string; pinHash: string };
    const isPasswordCorrect = bcrypt.compareSync(values.password, adminCredentials.passwordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, adminCredentials.pinHash);
    
    if (isPasswordCorrect && isPinCorrect) {
      localStorage.setItem("isLoggedInPrototype", "true");
      localStorage.setItem("isAdminPrototype", "true");
      localStorage.setItem('currentUserEmail', values.email); // Store admin email as current user
      
      // Store a simple admin profile for consistency if other parts of app use userProfilePrototype
      const adminProfileForStorage: UserProfile = {
          firstName: "Admin",
          lastName: "User",
          email: values.email,
          countryCode: "IN", // Or any default
          phoneNumber: "0000000000", // Placeholder
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
      toast({ title: "Admin Login Failed", description: failureMessage, variant: "destructive" });
    }
  }

  async function onInitialAdminSetupSubmit(values: InitialAdminSetupFormValues) {
      if (localStorage.getItem("adminAccessGranted") !== "true") {
        toast({ title: "Access Denied", description: "Please verify master access PIN first.", variant: "destructive" });
        router.push('/admin/access-gate');
        return;
      }

      try {
          const passwordHash = await bcrypt.hash(values.password, 10); // 10 salt rounds
          const pinHash = await bcrypt.hash(values.loginPin, 10); // 10 salt rounds

          // In a real application, you would securely save this to a database or configuration file.
          // For this prototype, we'll simulate saving by providing instructions.
          console.log("Admin credentials generated:");
          console.log("Email:", values.email);
          console.log("Password Hash:", passwordHash);
          console.log("PIN Hash:", pinHash);
          
          toast({
              title: "Admin Config Generated",
              description: "Please update src/data/admin.json with the generated hashes for email, passwordHash, and pinHash.",
              variant: "success",
              duration: 20000, // Long duration
          });
          // After generating and instructing, toggle back to potentially show the login form
          setShowSetupForm(false);
      } catch (error) {
          toast({ title: "Setup Error", description: "Failed to generate credentials.", variant: "destructive" });
      }
  }

  useEffect(() => {
    // Check if admin config is valid after mount
    if (hasMounted) {
      if (!isConfigValid) {
        setShowSetupForm(true); // Show setup form if config is invalid/missing
        toast({ 
          title: "Initial Admin Setup Required", 
          description: "Admin credentials are not configured. Please create the initial admin account.", 
          variant: "warning",
          duration: 10000
        });
      } else {
        setShowSetupForm(false); // Show login form if config is valid
      }
    }
  }, [hasMounted, isConfigValid, toast]);

  // Initial loading state while checking access and config
  if (!hasMounted || loadingConfig || (typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true")) {
    // Basic loading skeleton or null to avoid flash of unstyled content
    // If access is not granted, the useEffect should redirect. This is a fallback UI.
     if (hasMounted && typeof window !== 'undefined' && localStorage.getItem("adminAccessGranted") !== "true") {
         return null; // Avoid rendering anything if redirection is pending
     }
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-4">
                <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading Admin Login...</p>
            </div>
        </div>
    );
  }
  
  // Render Setup Form if required
  if (showSetupForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-amber-500 mb-2" />
              <CardTitle className="text-2xl font-bold text-amber-600">Initial Admin Setup</CardTitle>
              <CardDescription>Create the first administrator account credentials.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...initialAdminSetupForm}>
                <form onSubmit={initialAdminSetupForm.handleSubmit(onInitialAdminSetupSubmit)} className="space-y-6">
                  <FormField
                    control={initialAdminSetupForm.control}
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
                    control={initialAdminSetupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            {/* Use a separate state for setup form password visibility if needed */}
                            <Input type="password" placeholder="••••••••" {...field} /> 
                            {/* Add a toggle button if desired */}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={initialAdminSetupForm.control}
                    name="loginPin"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Admin 6-Digit Login PIN</FormLabel>
                          {/* Use a separate state for setup form PIN visibility if needed */}
                          {/* Add a toggle button if desired */}
                        </div>
                        <FormControl>
                            {/* Decide whether to show PIN by default or use toggle state */}
                            <PinInput length={6} {...field} showPin={true} /> 
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white" size="lg">
                    Generate Admin Credentials
                  </Button>
                </form>
              </Form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                  After generating, you will need to manually update <code>src/data/admin.json</code>.
              </p>
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
