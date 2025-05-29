
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

const MASTER_ADMIN_GATE_PIN_HASH = "$2a$20$BMfVfXJBPrHtoGLOqbJaDuNp0Q/58XXnXruaHTt.CwdErplfqMR/u"; // Hash for 21062005 (20 rounds)

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
    if (hasMounted && 
        localStorage.getItem("adminAccessGranted") === "true" &&
        localStorage.getItem("adminCredentialsConfigured") === "true" && 
        localStorage.getItem("isAdminPrototype") === "true" && 
        localStorage.getItem("isLoggedInPrototype") === "true") {
      router.push("/admin/dashboard");
    } else if (hasMounted && localStorage.getItem("adminAccessGranted") === "true") {
      // If gate is passed, but not fully logged in as admin, let them proceed to admin/login
      // which will decide if it needs setup or login.
      // No immediate redirect from here to /admin/login if only gate is passed.
      // The /admin/login page will handle this.
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
      setTimeout(() => {
        toast({ title: "Gate Access Granted", description: "Proceed to Admin Setup or Login." });
      }, 0);
      router.push("/admin/login"); 
    } else {
      setTimeout(() => {
        toast({ title: "Access Denied", description: "Incorrect master access PIN.", variant: "destructive" });
      }, 0);
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
