
// src/app/admin/login/page.tsx
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
import { Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import { getAdminCredentialsFromFile } from "@/app/actions/userActions";

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "6-digit Login PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

interface StoredAdminCredentials {
  email?: string;
  passwordHash?: string;
  pinHash?: string;
}

export default function AdminAuthPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configErrorMessage, setConfigErrorMessage] = useState<string | null>(null);
  const [storedAdminCredentials, setStoredAdminCredentials] = useState<StoredAdminCredentials | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(true);


  useEffect(() => {
    async function fetchAdminConfig() {
      setLoadingConfig(true);
      setConfigErrorMessage(null);
      const result = await getAdminCredentialsFromFile();
      if (result.configured && result.email && result.passwordHash && result.pinHash) {
        setStoredAdminCredentials({
          email: result.email,
          passwordHash: result.passwordHash,
          pinHash: result.pinHash,
        });
        adminLoginForm.setValue("email", result.email); // Pre-fill email
      } else {
        setStoredAdminCredentials(null);
        setConfigErrorMessage(result.error || "Admin credentials not configured. Please ensure src/data/admin.json is correctly set up by the developer.");
      }
      setLoadingConfig(false);
    }
    fetchAdminConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", loginPin: "" },
  });

  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (!storedAdminCredentials || !storedAdminCredentials.email || !storedAdminCredentials.passwordHash || !storedAdminCredentials.pinHash) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: configErrorMessage || "Admin credentials not configured correctly.", variant: "destructive", duration: 7000 });
      },0);
      return;
    }

    if (values.email.toLowerCase() !== storedAdminCredentials.email.toLowerCase()) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "Invalid admin email.", variant: "destructive" });
      },0);
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, storedAdminCredentials.passwordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, storedAdminCredentials.pinHash);

    if (!isPasswordCorrect || !isPinCorrect) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "Invalid admin password or login PIN.", variant: "destructive" });
      },0);
      return;
    }

    localStorage.setItem("isLoggedInPrototype", "true");
    localStorage.setItem("isAdminPrototype", "true");
    localStorage.setItem('currentUserEmail', storedAdminCredentials.email);
    const adminProfileForStorage = {
        firstName: "Admin",
        lastName: "User",
        email: storedAdminCredentials.email,
        countryCode: "N/A",
        phoneNumber: "N/A",
        isAdmin: true,
    };
    localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

    setTimeout(() => {
      toast({ title: "Admin Login Successful", description: "Welcome, Administrator!" });
    },0);
    router.push("/admin/dashboard");
  }

  if (loadingConfig) {
    return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"><p>Loading admin configuration...</p></div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="mt-2 text-3xl font-bold text-primary">Admin Panel Login</CardTitle>
          <CardDescription>Enter your administrator credentials for Earth Puran.</CardDescription>
        </CardHeader>
        <CardContent>
          {configErrorMessage && !storedAdminCredentials && (
            <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-start">
                <AlertTriangle className="mr-2 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Configuration Error!</p>
                  <p>{configErrorMessage}</p>
                  <p className="mt-2 text-xs">
                    Please ensure `src/data/admin.json` exists and is correctly formatted with non-placeholder, hashed credentials.
                  </p>
                </div>
              </div>
            </div>
          )}
          <Form {...adminLoginForm}>
            <form onSubmit={adminLoginForm.handleSubmit(onAdminLoginSubmit)} className="space-y-6">
              <FormField control={adminLoginForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl><Input placeholder="admin@earthpuran.com" {...field} readOnly={!!storedAdminCredentials?.email} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={adminLoginForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Password</FormLabel>
                  <FormControl><div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={adminLoginForm.control} name="loginPin" render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                      <FormLabel>Admin 6-Digit Login PIN</FormLabel>
                       <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLoginPin(!showLoginPin)}>
                          {showLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                  </div>
                  <FormControl><PinInput length={6} {...field} showPin={showLoginPin} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" size="lg" disabled={!storedAdminCredentials}>Log In to Admin Panel</Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="flex-col items-center space-y-2 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            This panel is for authorized administrators only.
          </p>
        </CardFooter>
      </Card>
       <Button variant="link" asChild className="mt-6">
        <Link href="/">Back to Store</Link>
      </Button>
    </div>
  );
}
