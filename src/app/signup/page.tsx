
"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Simplified country data
const countries = [
  { code: "US", name: "United States", flag: "🇺🇸", phoneCode: "+1" },
  { code: "CA", name: "Canada", flag: "🇨🇦", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", phoneCode: "+44" },
  { code: "AU", name: "Australia", flag: "🇦🇺", phoneCode: "+61" },
  { code: "IN", name: "India", flag: "🇮🇳", phoneCode: "+91" },
];

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address.").refine(val => val.endsWith('@gmail.com'), "Only Gmail addresses are allowed."),
  countryCode: z.string().min(1, "Country is required."),
  phoneNumber: z.string().min(5, "Phone number is required.").regex(/^\d+$/, "Phone number must be numeric."),
  password: passwordSchema,
  confirmPassword: z.string(),
  pin: z.string().length(6, "PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      pin: "",
    },
  });

  const currentPassword = form.watch("password");

  useEffect(() => {
    let strength = 0;
    if (currentPassword?.length >= 8) strength += 25;
    if (/[A-Z]/.test(currentPassword)) strength += 25;
    if (/[0-9]/.test(currentPassword)) strength += 25;
    if (/[^A-Za-z0-9]/.test(currentPassword)) strength += 25;
    setPasswordStrength(strength);
  }, [currentPassword]);

  function onSubmit(values: SignupFormValues) {
    // TODO: Implement signup logic
    console.log("Signup form submitted:", values);
    // toast({ title: "Account Creation", description: "Setting up your account..." });
    router.push("/");
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Create Your Account</CardTitle>
          <CardDescription>Join Earth Puran and embrace natural beauty.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Gmail only)</FormLabel>
                    <FormControl><Input placeholder="yourname@gmail.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                 <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.flag} {country.name} ({country.phoneCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input type="tel" placeholder="1234567890" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Create a strong password" {...field} />
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <Progress
                      value={passwordStrength}
                      className={cn(
                        "h-2 mt-1",
                        passwordStrength === 0 ? "bg-transparent" : // Hide if 0 or handle initial state
                        passwordStrength < 30 ? "bg-red-500" :
                        passwordStrength < 70 ? "bg-yellow-500" :
                        "bg-green-500"
                      )}
                    />
                    <FormDescription className="text-xs">
                      Min 8 chars, 1 uppercase, 1 number, 1 special char.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                     <FormControl>
                      <div className="relative">
                        <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    <FormLabel>6-Digit PIN</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPin ? "text" : "password"} placeholder="Create a 6-digit PIN" {...field} maxLength={6} />
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">This PIN will be used for quick access and sensitive actions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-primary">
              <Link href="/login">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
