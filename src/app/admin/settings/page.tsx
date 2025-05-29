
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getEarthPuranAdminCredentials,
  updateEarthPuranAdminEmail,
  updateEarthPuranAdminPassword,
  updateEarthPuranAdminPin,
} from "@/app/actions/userActions";
import { useRouter } from "next/navigation";

const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const changeEmailSchema = z.object({
  currentPasswordForEmail: z.string().min(1, "Current password is required to change email."),
  newEmail: z.string().email({ message: "Invalid email address." }),
});
type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

const changePasswordSchema = z.object({
  currentPasswordForPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordStrengthSchema,
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const changePinSchema = z.object({
  currentPin: z.string().length(6, "Current PIN must be 6 digits.").regex(/^\d+$/, "Current PIN must be numeric."),
  newPin: z.string().length(6, "New PIN must be 6 digits.").regex(/^\d+$/, "New PIN must be numeric."),
  confirmNewPin: z.string().length(6, "Confirm PIN must be 6 digits.").regex(/^\d+$/, "Confirm PIN must be numeric."),
}).refine(data => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match.",
  path: ["confirmNewPin"],
});
type ChangePinFormValues = z.infer<typeof changePinSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);

  const [showCurrentPasswordForEmail, setShowCurrentPasswordForEmail] = useState(false);
  const [showCurrentPasswordForPassword, setShowCurrentPasswordForPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [newPasswordStrength, setNewPasswordStrength] = useState(0);

  const [showCurrentPin, setShowCurrentPin] = useState(true);
  const [showNewPinInput, setShowNewPinInput] = useState(true);
  const [showConfirmNewPinInput, setShowConfirmNewPinInput] = useState(true);
  
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);


  useEffect(() => {
    async function fetchAdminEmail() {
      setLoadingEmail(true);
      const storedEmail = localStorage.getItem('currentUserEmail');
      if (storedEmail) {
          setCurrentAdminEmail(storedEmail);
      } else {
        // Fallback if localStorage somehow cleared but user is on admin page
        const creds = await getEarthPuranAdminCredentials();
        if (creds.configured && creds.email) {
          setCurrentAdminEmail(creds.email);
        } else {
          // Should not happen if admin layout guard is working
          toast({ title: "Error", description: "Admin email not found. Please log in again.", variant: "destructive" });
          router.push('/admin/login');
        }
      }
      setLoadingEmail(false);
    }
    fetchAdminEmail();
  }, [router, toast]);

  const emailForm = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { currentPasswordForEmail: "", newEmail: "" },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPasswordForPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const pinForm = useForm<ChangePinFormValues>({
    resolver: zodResolver(changePinSchema),
    defaultValues: { currentPin: "", newPin: "", confirmNewPin: "" },
  });
  
  const watchedNewPassword = passwordForm.watch("newPassword");
  useEffect(() => {
    let strength = 0;
    if (watchedNewPassword) {
      if (watchedNewPassword.length >= 8) strength += 25;
      if (/[A-Z]/.test(watchedNewPassword)) strength += 25;
      if (/[0-9]/.test(watchedNewPassword)) strength += 25;
      if (/[^A-Za-z0-9]/.test(watchedNewPassword)) strength += 25;
    }
    setNewPasswordStrength(strength);
  }, [watchedNewPassword]);

  async function handleEmailChange(values: ChangeEmailFormValues) {
    setIsSubmittingEmail(true);
    const result = await updateEarthPuranAdminEmail(values.newEmail, values.currentPasswordForEmail);
    if (result.success && result.newEmail) {
      toast({ title: "Admin Email Updated", description: result.message });
      localStorage.setItem('currentUserEmail', result.newEmail); // Update localStorage
      setCurrentAdminEmail(result.newEmail); // Update local state
      emailForm.reset();
    } else {
      toast({ title: "Email Update Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmittingEmail(false);
  }

  async function handlePasswordChange(values: ChangePasswordFormValues) {
    setIsSubmittingPassword(true);
    const result = await updateEarthPuranAdminPassword(values.currentPasswordForPassword, values.newPassword);
    if (result.success) {
      toast({ title: "Admin Password Updated", description: result.message });
      passwordForm.reset();
    } else {
      toast({ title: "Password Update Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmittingPassword(false);
  }

  async function handlePinChange(values: ChangePinFormValues) {
    setIsSubmittingPin(true);
    const result = await updateEarthPuranAdminPin(values.currentPin, values.newPin);
    if (result.success) {
      toast({ title: "Admin PIN Updated", description: result.message });
      pinForm.reset();
    } else {
      toast({ title: "PIN Update Failed", description: result.message, variant: "destructive" });
    }
    setIsSubmittingPin(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Change Admin Email</CardTitle>
          <CardDescription>
            Current Email: {loadingEmail ? <Skeleton className="h-4 w-48 inline-block" /> : <span>{currentAdminEmail || "Not available"}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailChange)} className="space-y-6">
              <FormField
                control={emailForm.control}
                name="currentPasswordForEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showCurrentPasswordForEmail ? "text" : "password"} placeholder="Enter current password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPasswordForEmail(!showCurrentPasswordForEmail)}>
                          {showCurrentPasswordForEmail ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="newadmin@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingEmail}>
                 {isSubmittingEmail ? <Loader2 className="animate-spin" /> : "Update Email"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Admin Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
              <FormField
                control={passwordForm.control}
                name="currentPasswordForPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                     <FormControl>
                      <div className="relative">
                        <Input type={showCurrentPasswordForPassword ? "text" : "password"} placeholder="Enter current password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPasswordForPassword(!showCurrentPasswordForPassword)}>
                          {showCurrentPasswordForPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showNewPassword ? "text" : "password"} placeholder="Create a new strong password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <Progress value={newPasswordStrength} className="h-2 mt-1" indicatorClassName={cn({'bg-red-500': newPasswordStrength < 50, 'bg-yellow-500': newPasswordStrength >= 50 && newPasswordStrength < 75, 'bg-green-500': newPasswordStrength >= 75})} />
                    <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showConfirmNewPassword ? "text" : "password"} placeholder="Confirm new password" {...field} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                          {showConfirmNewPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingPassword}>
                {isSubmittingPassword ? <Loader2 className="animate-spin" /> : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Admin Login PIN</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...pinForm}>
            <form onSubmit={pinForm.handleSubmit(handlePinChange)} className="space-y-6">
              <FormField
                control={pinForm.control}
                name="currentPin"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Current 6-Digit Login PIN</FormLabel>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCurrentPin(!showCurrentPin)}>{showCurrentPin ? <EyeOff /> : <Eye />}</Button>
                    </div>
                    <FormControl><PinInput length={6} {...field} showPin={showCurrentPin} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pinForm.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center justify-between">
                        <FormLabel>New 6-Digit Login PIN</FormLabel>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNewPinInput(!showNewPinInput)}>{showNewPinInput ? <EyeOff /> : <Eye />}</Button>
                    </div>
                    <FormControl><PinInput length={6} {...field} showPin={showNewPinInput} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={pinForm.control}
                name="confirmNewPin"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Confirm New 6-Digit Login PIN</FormLabel>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowConfirmNewPinInput(!showConfirmNewPinInput)}>{showConfirmNewPinInput ? <EyeOff /> : <Eye />}</Button>
                    </div>
                    <FormControl><PinInput length={6} {...field} showPin={showConfirmNewPinInput} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingPin}>
                {isSubmittingPin ? <Loader2 className="animate-spin" /> : "Update PIN"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
