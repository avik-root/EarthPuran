
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import { cn } from "@/lib/utils";
import { getEarthPuranAdminCredentials, createEarthPuranAdminAccount } from "@/app/actions/userActions";
import type { UserProfile } from "@/types/userData";

const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const createAdminSchema = z.object({
  adminEmail: z.string().email({ message: "Invalid email address." }),
  adminPassword: passwordStrengthSchema,
  confirmAdminPassword: z.string(),
  adminLoginPin: z.string().length(6, { message: "Login PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
  confirmAdminLoginPin: z.string().length(6, { message: "Confirm PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
}).refine(data => data.adminPassword === data.confirmAdminPassword, {
  message: "Passwords don't match.",
  path: ["confirmAdminPassword"],
}).refine(data => data.adminLoginPin === data.confirmAdminLoginPin, {
  message: "Login PINs don't match.",
  path: ["confirmAdminLoginPin"],
});
type CreateAdminFormValues = z.infer<typeof createAdminSchema>;

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  loginPin: z.string().length(6, { message: "Login PIN must be 6 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
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

  const [uiMode, setUiMode] = useState<'loading' | 'createAdmin' | 'loginAdmin'>('loading');
  const [configErrorMessage, setConfigErrorMessage] = useState<string | null>(null);
  const [storedAdminCredentials, setStoredAdminCredentials] = useState<StoredAdminCredentials | null>(null);
  
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // States for Create Admin Form
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmCreatePassword, setShowConfirmCreatePassword] = useState(false);
  const [createPasswordStrength, setCreatePasswordStrength] = useState(0);
  const [showCreateLoginPin, setShowCreateLoginPin] = useState(true);
  const [showConfirmCreateLoginPin, setShowConfirmCreateLoginPin] = useState(true);

  // States for Login Admin Form
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLoginPinInput, setShowLoginPinInput] = useState(true);


  const fetchAdminConfig = async () => {
    setUiMode('loading');
    setConfigErrorMessage(null);
    try {
      const result = await getEarthPuranAdminCredentials();
      if (result.configured && result.email && result.passwordHash && result.pinHash) {
        setStoredAdminCredentials({
          email: result.email,
          passwordHash: result.passwordHash,
          pinHash: result.pinHash,
        });
        adminLoginForm.setValue("email", result.email); 
        setUiMode('loginAdmin');
      } else {
        setStoredAdminCredentials(null);
        setConfigErrorMessage(result.error || "Admin account not configured. Please create one.");
        setUiMode('createAdmin'); 
      }
    } catch (e) {
        console.error("Error fetching admin config:", e);
        setConfigErrorMessage("Could not check admin configuration. Please try again or create an account.");
        setUiMode('createAdmin');
    }
  };
  
  useEffect(() => {
    fetchAdminConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const createAdminForm = useForm<CreateAdminFormValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { adminEmail: "", adminPassword: "", confirmAdminPassword: "", adminLoginPin: "", confirmAdminLoginPin: "" },
  });

  const adminLoginForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "", loginPin: "" },
  });

  const watchedCreatePassword = createAdminForm.watch("adminPassword");
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
    setIsSubmittingCreate(true);
    try {
      const result = await createEarthPuranAdminAccount(values.adminEmail, values.adminPassword, values.adminLoginPin);
      if (result.success && result.adminData) {
        setTimeout(() => {
          toast({ title: "Admin Account Created", description: result.message });
        }, 0);
        // After successful creation, refresh config to switch to login mode
        await fetchAdminConfig(); 
      } else {
        setTimeout(() => {
          toast({ title: "Creation Failed", description: result.message || "Could not create admin account.", variant: "destructive" });
        }, 0);
      }
    } catch (error) {
      console.error("Admin creation error:", error);
       setTimeout(() => {
        toast({ title: "Creation Error", description: "An unexpected error occurred.", variant: "destructive" });
      },0);
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function onAdminLoginSubmit(values: AdminLoginFormValues) {
    setIsSubmittingLogin(true);
    if (!storedAdminCredentials || !storedAdminCredentials.email || !storedAdminCredentials.passwordHash || !storedAdminCredentials.pinHash) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: configErrorMessage || "Admin credentials not configured correctly. Please ensure earthpuranadmin.json is correctly set up.", variant: "destructive", duration: 7000 });
      },0);
      setIsSubmittingLogin(false);
      return;
    }

    if (values.email.toLowerCase() !== storedAdminCredentials.email.toLowerCase()) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "Invalid admin email.", variant: "destructive" });
      },0);
      setIsSubmittingLogin(false);
      return;
    }

    const isPasswordCorrect = bcrypt.compareSync(values.password, storedAdminCredentials.passwordHash);
    const isPinCorrect = bcrypt.compareSync(values.loginPin, storedAdminCredentials.pinHash);

    if (!isPasswordCorrect || !isPinCorrect) {
      setTimeout(() => {
        toast({ title: "Login Failed", description: "Invalid admin password or login PIN.", variant: "destructive" });
      },0);
      setIsSubmittingLogin(false);
      return;
    }

    localStorage.setItem("isLoggedInPrototype", "true");
    localStorage.setItem("isAdminPrototype", "true");
    localStorage.setItem('currentUserEmail', storedAdminCredentials.email);
    // For prototype, store a generic admin profile. A real app might fetch more details.
    const adminProfileForStorage: UserProfile = {
        firstName: "Admin",
        lastName: "User",
        email: storedAdminCredentials.email,
        countryCode: "N/A", // Not relevant for admin
        phoneNumber: "N/A", // Not relevant for admin
        isAdmin: true,
    };
    localStorage.setItem('userProfilePrototype', JSON.stringify(adminProfileForStorage));

    setTimeout(() => {
      toast({ title: "Admin Login Successful", description: "Welcome, Administrator!" });
    },0);
    router.push("/admin/dashboard");
    setIsSubmittingLogin(false);
  }

  if (uiMode === 'loading') {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Checking admin configuration...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40">
      {uiMode === 'createAdmin' && (
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-2 text-3xl font-bold text-primary">Create Admin Account</CardTitle>
            <CardDescription>Set up the primary administrator for Earth Puran.</CardDescription>
            {configErrorMessage && (
                 <Alert variant="default" className="mt-4 text-sm bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
                    <AlertTriangle className="h-4 w-4 !text-blue-700 dark:!text-blue-300" />
                    <AlertTitle>Configuration Note</AlertTitle>
                    <AlertDescription>{configErrorMessage}</AlertDescription>
                 </Alert>
            )}
          </CardHeader>
          <CardContent>
            <Form {...createAdminForm}>
              <form onSubmit={createAdminForm.handleSubmit(onCreateAdminSubmit)} className="space-y-6">
                <FormField control={createAdminForm.control} name="adminEmail" render={({ field }) => (
                  <FormItem><FormLabel>Admin Email</FormLabel><FormControl><Input placeholder="admin@earthpuran.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createAdminForm.control} name="adminPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl><div className="relative"><Input type={showCreatePassword ? "text" : "password"} placeholder="Create a strong password" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCreatePassword(!showCreatePassword)}>{showCreatePassword ? <EyeOff /> : <Eye />}</Button></div></FormControl>
                    <Progress value={createPasswordStrength} className="h-2 mt-1" indicatorClassName={cn({'bg-red-500': createPasswordStrength < 50, 'bg-yellow-500': createPasswordStrength >= 50 && createPasswordStrength < 75, 'bg-green-500': createPasswordStrength >= 75})} />
                    <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription><FormMessage />
                  </FormItem>
                )} />
                <FormField control={createAdminForm.control} name="confirmAdminPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Admin Password</FormLabel><FormControl><div className="relative"><Input type={showConfirmCreatePassword ? "text" : "password"} placeholder="Confirm password" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmCreatePassword(!showConfirmCreatePassword)}>{showConfirmCreatePassword ? <EyeOff /> : <Eye />}</Button></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createAdminForm.control} name="adminLoginPin" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between"><FormLabel>Admin 6-Digit Login PIN</FormLabel><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreateLoginPin(!showCreateLoginPin)}>{showCreateLoginPin ? <EyeOff /> : <Eye />}</Button></div>
                    <FormControl><PinInput length={6} {...field} showPin={showCreateLoginPin} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={createAdminForm.control} name="confirmAdminLoginPin" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between"><FormLabel>Confirm Admin PIN</FormLabel><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConfirmCreateLoginPin(!showConfirmCreateLoginPin)}>{showConfirmCreateLoginPin ? <EyeOff /> : <Eye />}</Button></div>
                    <FormControl><PinInput length={6} {...field} showPin={showConfirmCreateLoginPin} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" size="lg" disabled={isSubmittingCreate}>
                  {isSubmittingCreate ? <Loader2 className="animate-spin" /> : "Create Admin Account"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {uiMode === 'loginAdmin' && (
         <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="mt-2 text-3xl font-bold text-primary">Admin Panel Login</CardTitle>
            <CardDescription>Enter your administrator credentials for Earth Puran.</CardDescription>
             {configErrorMessage && !storedAdminCredentials && ( // Show this only if login mode is active but creds are bad
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuration Error!</AlertTitle>
                    <AlertDescription>{configErrorMessage}. Please ensure `src/data/earthpuranadmin.json` is correctly set up or contact support if this persists.</AlertDescription>
                </Alert>
            )}
          </CardHeader>
          <CardContent>
            <Form {...adminLoginForm}>
              <form onSubmit={adminLoginForm.handleSubmit(onAdminLoginSubmit)} className="space-y-6">
                <FormField control={adminLoginForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Admin Email</FormLabel><FormControl><Input placeholder="admin@earthpuran.com" {...field} readOnly={!!storedAdminCredentials?.email} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminLoginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl><div className="relative"><Input type={showLoginPassword ? "text" : "password"} placeholder="••••••••" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowLoginPassword(!showLoginPassword)}>{showLoginPassword ? <EyeOff /> : <Eye />}</Button></div></FormControl><FormMessage />
                  </FormItem>
                )} />
                <FormField control={adminLoginForm.control} name="loginPin" render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between"><FormLabel>Admin 6-Digit Login PIN</FormLabel><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLoginPinInput(!showLoginPinInput)}>{showLoginPinInput ? <EyeOff /> : <Eye />}</Button></div>
                    <FormControl><PinInput length={6} {...field} showPin={showLoginPinInput} /></FormControl><FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" size="lg" disabled={!storedAdminCredentials || isSubmittingLogin}>
                  {isSubmittingLogin ? <Loader2 className="animate-spin" /> : "Log In to Admin Panel"}
                </Button>
              </form>
            </Form>
          </CardContent>
           <CardFooter className="flex-col items-center space-y-2 pt-6">
            <p className="text-xs text-muted-foreground text-center">This panel is for authorized administrators only.</p>
            {uiMode === 'loginAdmin' && !storedAdminCredentials && ( // If login mode but no creds, means file issue
                <Button variant="link" onClick={fetchAdminConfig} className="text-xs">
                   Problem loading credentials? Recheck Configuration
                </Button>
            )}
          </CardFooter>
        </Card>
      )}
       <Button variant="link" asChild className="mt-6">
        <Link href="/">Back to Store</Link>
      </Button>
    </div>
  );
}

