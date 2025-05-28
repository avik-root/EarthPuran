
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { updateUserPasswordAction, updateUserPinAction } from "@/app/actions/userActions";

const passwordStrengthSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const baseEditProfileSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordStrengthSchema.optional().or(z.literal('')), // Allow empty string if not changing
  confirmNewPassword: z.string().optional(),
  currentPin: z.string().optional(),
  newPin: z.string().optional().or(z.literal('')), // Allow empty string
  confirmNewPin: z.string().optional(),
});

type EditProfileFormValues = z.infer<typeof baseEditProfileSchema>;

// Specific schema for password change validation
const passwordChangeValidationSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordStrengthSchema, // New password must meet strength if provided
  confirmNewPassword: z.string().min(1, "Please confirm your new password."),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

// Specific schema for PIN change validation
const pinChangeValidationSchema = z.object({
  currentPin: z.string().length(6, "Current PIN must be 6 digits.").regex(/^\d+$/, "Current PIN must be numeric."),
  newPin: z.string().length(6, "New PIN must be 6 digits.").regex(/^\d+$/, "New PIN must be numeric."),
  confirmNewPin: z.string().length(6, "Confirm PIN must be 6 digits.").regex(/^\d+$/, "Confirm PIN must be numeric."),
}).refine(data => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match.",
  path: ["confirmNewPin"],
});


export function EditProfileForm() {
  const { toast } = useToast();
  const [visibleSection, setVisibleSection] = useState<'none' | 'password' | 'pin'>('none');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [newPasswordStrength, setNewPasswordStrength] = useState(0);

  const [showCurrentPin, setShowCurrentPin] = useState(true);
  const [showNewPin, setShowNewPin] = useState(true);
  const [showConfirmNewPin, setShowConfirmNewPin] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('currentUserEmail'));
    }
  }, []);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(baseEditProfileSchema), 
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      currentPin: "",
      newPin: "",
      confirmNewPin: "",
    },
  });

  const watchedNewPassword = form.watch("newPassword");

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

  async function onSubmit(values: EditProfileFormValues) {
    if (!currentUserEmail) {
      toast({ title: "Error", description: "You must be logged in to change security settings.", variant: "destructive"});
      return;
    }
    form.clearErrors(); 

    if (visibleSection === 'password') {
      const validationData = {
        currentPassword: values.currentPassword || "",
        newPassword: values.newPassword || "",
        confirmNewPassword: values.confirmNewPassword || "",
      };
      const result = passwordChangeValidationSchema.safeParse(validationData);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          form.setError(issue.path[0] as keyof EditProfileFormValues, { message: issue.message, type: 'manual' });
        });
        return;
      }
      
      const updateResult = await updateUserPasswordAction(currentUserEmail, result.data.currentPassword, result.data.newPassword);
      if (updateResult.success) {
        toast({ title: "Password Changed", description: updateResult.message });
        setVisibleSection('none');
        form.reset();
      } else {
        toast({ title: "Password Change Failed", description: updateResult.message, variant: "destructive" });
      }

    } else if (visibleSection === 'pin') {
       const validationData = {
        currentPin: values.currentPin || "",
        newPin: values.newPin || "",
        confirmNewPin: values.confirmNewPin || "",
      };
      const result = pinChangeValidationSchema.safeParse(validationData);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          form.setError(issue.path[0] as keyof EditProfileFormValues, { message: issue.message, type: 'manual' });
        });
        return;
      }

      const updateResult = await updateUserPinAction(currentUserEmail, result.data.currentPin, result.data.newPin);
      if (updateResult.success) {
        toast({ title: "PIN Changed", description: updateResult.message });
        setVisibleSection('none');
        form.reset();
      } else {
        toast({ title: "PIN Change Failed", description: updateResult.message, variant: "destructive" });
      }
    }
  }

  const handleCancel = () => {
    setVisibleSection('none');
    form.reset();
    form.clearErrors();
  }

  if (typeof window !== 'undefined' && !localStorage.getItem('currentUserEmail')) {
      return <p className="text-muted-foreground text-center py-4">Please log in to edit your profile.</p>;
  }

  if (visibleSection === 'none') {
    return (
      <div className="space-y-4">
        <Button onClick={() => setVisibleSection('password')} className="w-full sm:w-auto">Change Password</Button>
        <Button onClick={() => setVisibleSection('pin')} className="w-full sm:w-auto ml-0 sm:ml-4" variant="outline">Change PIN</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {visibleSection === 'password' && (
          <section className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">Change Password</h3>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showCurrentPassword ? "text" : "password"} placeholder="Enter your current password" {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)} aria-label="Toggle current password visibility">
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showNewPassword ? "text" : "password"} placeholder="Enter your new password" {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)} aria-label="Toggle new password visibility">
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <Progress
                    value={newPasswordStrength}
                    className="h-2 mt-1"
                    indicatorClassName={cn({
                      'bg-red-500': newPasswordStrength > 0 && newPasswordStrength < 50,
                      'bg-yellow-500': newPasswordStrength >= 50 && newPasswordStrength < 75,
                      'bg-green-500': newPasswordStrength >= 75,
                    })}
                  />
                  <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 number, 1 special char.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showConfirmNewPassword ? "text" : "password"} placeholder="Confirm your new password" {...field} />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} aria-label="Toggle confirm new password visibility">
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        )}

        {visibleSection === 'pin' && (
          <section className="space-y-6">
            <h3 className="text-lg font-medium text-foreground">Change PIN</h3>
            <FormField
              control={form.control}
              name="currentPin"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Current 6-Digit PIN</FormLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                            aria-label={showCurrentPin ? "Hide Current PIN" : "Show Current PIN"}
                        >
                            {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  <FormControl>
                    <PinInput length={6} {...field} showPin={showCurrentPin} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPin"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>New 6-Digit PIN</FormLabel>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowNewPin(!showNewPin)}
                        aria-label={showNewPin ? "Hide New PIN" : "Show New PIN"}
                    >
                        {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormControl>
                    <PinInput length={6} {...field} showPin={showNewPin} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPin"
              render={({ field }) => (
                <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Confirm New 6-Digit PIN</FormLabel>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setShowConfirmNewPin(!showConfirmNewPin)}
                            aria-label={showConfirmNewPin ? "Hide Confirm New PIN" : "Show Confirm New PIN"}
                        >
                            {showConfirmNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                  <FormControl>
                    <PinInput length={6} {...field} showPin={showConfirmNewPin} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        )}
        
        {(visibleSection === 'password' || visibleSection === 'pin') && (
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="submit">Save {visibleSection === 'password' ? 'Password' : 'PIN'} Changes</Button>
            </div>
        )}
      </form>
    </Form>
  );
}
