
// src/app/admin/access-gate/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PinInput } from "@/components/ui/pin-input";
import { Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import bcrypt from 'bcryptjs';
import Link from "next/link";

// This is the bcrypt hash of the 8-digit master PIN (e.g., "12345678")
const MASTER_ADMIN_GATE_PIN_HASH = "$2a$20$KuFzQzevqXrkru82XJB61et1l/xcrTAh0hzP9aYYn9K4mJRN8E4ja"; // Keep this secure

const accessGateSchema = z.object({
  gatePin: z.string().length(8, { message: "PIN must be 8 digits." }).regex(/^\d+$/, { message: "PIN must be numeric." }),
});

type AccessGateFormValues = z.infer<typeof accessGateSchema>;

export default function AdminAccessGatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showGatePin, setShowGatePin] = useState(true); 
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    // If user somehow gets here but already passed the gate AND has admin credentials configured AND is logged in as admin, redirect to dashboard
    if (hasMounted && 
        localStorage.getItem("adminAccessGranted") === "true" &&
        localStorage.getItem("adminCredentialsConfigured") === "true" && // New check
        localStorage.getItem("isAdminPrototype") === "true" &&
        localStorage.getItem("isLoggedInPrototype") === "true") {
      router.push("/admin/dashboard");
    } else if (hasMounted && localStorage.getItem("adminAccessGranted") === "true") {
      // If gate passed but other conditions not met, go to login/setup page
      router.push("/admin/login");
    }
  }, [hasMounted, router]);

  const form = useForm<AccessGateFormValues>({
    resolver: zodResolver(accessGateSchema),
    defaultValues: {
      gatePin: "",
    },
  });

  async function onSubmit(values: AccessGateFormValues) {
    const isPinCorrect = bcrypt.compareSync(values.gatePin, MASTER_ADMIN_GATE_PIN_HASH);
    
    if (isPinCorrect) {
      localStorage.setItem("adminAccessGranted", "true");
      toast({ title: "Access Granted", description: "Proceed to Admin Setup or Login." });
      router.push("/admin/login"); // This page will handle if it's setup or login
    } else {
      toast({ title: "Access Denied", description: "Incorrect master access PIN.", variant: "destructive" });
      form.resetField("gatePin");
    }
  }

  if (!hasMounted) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">Admin Area Gate</CardTitle>
          <CardDescription>Enter the 8-digit master security PIN to proceed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="gatePin"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>8-Digit Master Access PIN</FormLabel>
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowGatePin(!showGatePin)}
                          aria-label={showGatePin ? "Hide PIN" : "Show PIN"}
                        >
                          {showGatePin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                    <FormControl>
                      <PinInput
                        length={8}
                        value={field.value}
                        onChange={field.onChange}
                        name={field.name}
                        onBlur={field.onBlur}
                        disabled={field.disabled}
                        showPin={showGatePin} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                Verify Master PIN
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
