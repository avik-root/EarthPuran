
// src/app/admin/login/page.tsx
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { Eye, EyeOff, ShieldCheck, UserPlus, Copy, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getAdminCredentialsFromFile } from "@/app/actions/userActions"; // Import the new server action

const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const createAdminSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: passwordStrengthSchema,
  confirmPassword: z.string(),
  loginPin: z.string().length(6, { message: "6-digit Login PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
  confirmLoginPin: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
}).refine(data => data.loginPin === data.confirmLoginPin, {
  message: "Login PINs don't match.",
  path: ["confirmLoginPin"],
});

type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "6-digit Login PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

interface GeneratedAdminConfig {
  email: string;
  passwordHash: string;
  pinHash: string;
}

interface StoredAdminCredentials {
  email?: string;
  passwordHash?: string;
  pinHash?: string;
}

export default function AdminAuthPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [uiMode, setUiMode] = useState<'loading' | 'createAdmin' | 'loginAdmin' | 'showConfigInstructions' | 'configError'>('loading');
  const [configErrorMessage, setConfigErrorMessage] = useState<string | null>(null);
  const [storedAdminCredentials, setStoredAdminCredentials] = useState<StoredAdminCredentials | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedAdminConfig | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(true);
  const [showConfirmLoginPin, setShowConfirmLoginPin] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const fetchAdminConfig = async () => {
    setUiMode('loading');
    const result = await getAdminCredentialsFromFile();
    if (result.configured && result.email && result.passwordHash && result.pinHash) {
      setStoredAdminCredentials({
        email: result.email,
        passwordHash: result.passwordHash,
        pinHash: result.pinHash,
      });
      adminLoginForm.setValue("email", result.email); // Pre-fill email for login form
      setUiMode('loginAdmin');
    } else {
      setStoredAdminCredentials(null);
      if (result.error) {
          console.warn("Admin config error:", result.error);
          // Keep in createAdmin mode if admin.json is not found or uses placeholders
          // This allows the "Create Admin Account" flow to proceed
          if (result.error.includes("not found") || result.error.includes("placeholder values")) {
             setUiMode('createAdmin');
          } else {
            // For other errors (e.g., malformed JSON), show a specific error message
            setConfigErrorMessage(result.error);
            setUiMode('configError');
          }
      } else {
        setUiMode('createAdmin'); // Default to create if not configured and no specific error
      }
    }
  };

  useEffect(() => {
    fetchAdminConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAdminForm = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", loginPin: "", confirmLoginPin: "" },
  });

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", loginPin: "" },
  });

  const currentPassword = createAdminForm.watch("password");
  useEffect(() => {
    let strength = 0;
    if (currentPassword) {
      if (currentPassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(currentPassword)) strength += 25;
      if (/[0-9]/.test(currentPassword)) strength += 25;
      if (/[^A-Za-z0-9]/.test(currentPassword)) strength += 25;
    }
    setPasswordStrength(strength);
  }, [currentPassword]);

  async function onCreateAdminSubmit(values: CreateAdminFormValues) {
    const saltRounds = 10; // Consistent with userActions
    const hashedPassword = bcrypt.hashSync(values.password, saltRounds);
    const hashedLoginPin = bcrypt.hashSync(values.loginPin, saltRounds);

    setGeneratedConfig({
      email: values.email,
      passwordHash: hashedPassword,
      pinHash: hashedLoginPin,
    });
    setUiMode('showConfigInstructions');
    toast({
      title: "Admin Configuration Ready",
      description: "Please follow the instructions to update admin.json.",
      duration: 10000,
    });
  }

  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    if (!storedAdminCredentials || !storedAdminCredentials.email || !storedAdminCredentials.passwordHash || !storedAdminCredentials.pinHash) {
      toast({ title: "Login Failed", description: "Admin credentials not configured correctly. Please update admin.json or use the create admin flow if this is the first setup.", variant: "destructive", duration: 7000 });
      fetchAdminConfig(); // Re-check config and potentially switch to 'createAdmin' mode
      return;
    }

    if (values.email.toLowerCase() !== storedAdminCredentials.email.toLowerCase()) {
      toast({ title: "Login Failed", description: "Invalid admin email.", variant: "destructive" });
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, storedAdminCredentials.passwordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, storedAdminCredentials.pinHash);

    if (!isPasswordCorrect || !isPinCorrect) {
      toast({ title: "Login Failed", description: "Invalid admin password or login PIN.", variant: "destructive" });
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

    toast({ title: "Admin Login Successful", description: "Welcome, Administrator!" });
    router.push("/admin/dashboard");
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Content copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
      console.error('Failed to copy text: ', err);
    });
  };

  if (uiMode === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"><p>Loading admin configuration...</p></div>;
  }

  if (uiMode === 'configError' && configErrorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
         <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <CardTitle className="mt-2 text-3xl font-bold text-destructive">Configuration Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Could not load admin credentials:</p>
            <p className="text-sm text-destructive font-medium mb-4">{configErrorMessage}</p>
            <p className="text-xs text-muted-foreground">Please check your `src/data/admin.json` file or proceed to create admin credentials if this is the first setup.</p>
            <Button onClick={() => setUiMode('createAdmin')} className="mt-4">Create Admin Account</Button>
          </CardContent>
        </Card>
         <Button variant="link" asChild className="mt-6">
          <Link href="/">Back to Store</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      {uiMode === 'createAdmin' && (
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-2 text-3xl font-bold text-primary">Create Admin Account</CardTitle>
            <CardDescription>Set up the primary administrator for Earth Puran.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createAdminForm}>
              <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-6">
                <FormField control={createAdminForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Email Address</FormLabel>
                    <FormControl><Input placeholder="admin@earthpuran.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createAdminForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl><div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div></FormControl>
                    <Progress value={passwordStrength} className="h-2 mt-1" indicatorClassName={cn({ 'bg-red-500': passwordStrength < 50, 'bg-yellow-500': passwordStrength >= 50 && passwordStrength < 75, 'bg-green-500': passwordStrength >= 75 })} />
                    <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createAdminForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Admin Password</FormLabel>
                    <FormControl><div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createAdminForm.control} name="loginPin" render={({ field }) => (
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
                <FormField control={createAdminForm.control} name="confirmLoginPin" render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center justify-between">
                      <FormLabel>Confirm Admin 6-Digit Login PIN</FormLabel>
                       <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConfirmLoginPin(!showConfirmLoginPin)}>
                        {showConfirmLoginPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <FormControl><PinInput length={6} {...field} showPin={showConfirmLoginPin} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" size="lg">Generate Admin Configuration</Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter className="text-center text-xs text-muted-foreground">
            <p>This will generate hashed credentials. You will need to manually update `src/data/admin.json`.</p>
          </CardFooter>
        </Card>
      )}

      {uiMode === 'showConfigInstructions' && generatedConfig && (
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-2 text-3xl font-bold text-primary">ACTION REQUIRED: Configure Admin</CardTitle>
            <CardDescription>
              To complete admin setup, create or update the file <code>src/data/admin.json</code> in your project with the following content.
              Then, click "Proceed to Login".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="font-medium">Create/Update <code>src/data/admin.json</code> with:</p>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto relative">
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => copyToClipboard(JSON.stringify(generatedConfig, null, 2))}>
                <Copy className="h-3 w-3"/>
              </Button>
              <code>
                {JSON.stringify(generatedConfig, null, 2)}
              </code>
            </pre>
            <Button onClick={() => {
              fetchAdminConfig(); // Re-fetch to see if admin.json was updated
            }} className="w-full" size="lg">
              I've Updated admin.json, Proceed to Login
            </Button>
          </CardContent>
        </Card>
      )}

      {uiMode === 'loginAdmin' && storedAdminCredentials && (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-2 text-3xl font-bold text-primary">Admin Panel Login</CardTitle>
            <CardDescription>Enter your administrator credentials for Earth Puran.</CardDescription>
          </CardHeader>
          <CardContent>
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
                <Button type="submit" className="w-full" size="lg">Log In to Admin Panel</Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter className="flex-col items-center space-y-2 pt-6">
            <p className="text-xs text-muted-foreground">
              Not seeing the login form after creating an admin? Ensure `src/data/admin.json` is correctly updated with non-placeholder values.
            </p>
            <Button variant="link" size="sm" onClick={() => {
              // This offers a way to "reset" the flow if admin.json is misconfigured
              // by forcing the Create Admin flow again.
              // In a real app, you'd have a more robust recovery mechanism.
              setUiMode('createAdmin');
              setStoredAdminCredentials(null); // Clear any cached/stale credentials
            }}>
              Re-run Admin Setup / Create Admin
            </Button>
          </CardFooter>
        </Card>
      )}
       <Button variant="link" asChild className="mt-6">
        <Link href="/">Back to Store</Link>
      </Button>
    </div>
  );
}
