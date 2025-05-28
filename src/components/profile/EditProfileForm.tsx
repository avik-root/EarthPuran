
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PinInput } from "@/components/ui/pin-input";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Progress } from "@/components/ui/progress"; // Import Progress
import { cn } from "@/lib/utils"; // Import cn

// import { updateUserProfile } from "@/app/actions/userActions"; // For actual profile updates

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const editProfileSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
  currentPin: z.string().length(6, "Current PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
  newPin: z.string().length(6, "New PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
  confirmNewPin: z.string().length(6, "Confirm PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
})
.refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
})
.refine(data => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match.",
  path: ["confirmNewPin"],
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileForm() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [newPasswordStrength, setNewPasswordStrength] = useState(0); // State for new password strength

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('currentUserEmail'));
    }
  }, []);


  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
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
    if (watchedNewPassword?.length >= 8) strength += 25;
    if (/[A-Z]/.test(watchedNewPassword)) strength += 25;
    if (/[0-9]/.test(watchedNewPassword)) strength += 25;
    if (/[^A-Za-z0-9]/.test(watchedNewPassword)) strength += 25;
    setNewPasswordStrength(strength);
  }, [watchedNewPassword]);

  async function onSubmit(values: EditProfileFormValues) {
    if (!currentUserEmail) {
        toast({ title: "Error", description: "You must be logged in to change security settings.", variant: "destructive"});
        return;
    }
    console.log("Edit profile form submitted:", values);
    // In a real app:
    // 1. Verify currentPassword and currentPin against stored hashed values for currentUserEmail.
    // 2. If valid, hash newPassword and newPin and call an action like:
    //    await updateUserSecurity(currentUserEmail, { newHashedPassword: ..., newHashedPin: ... });
    // For this prototype, we'll just show a success message.
    
    toast({ title: "Security Info Updated (Simulated)", description: "Your password and PIN have been successfully updated." });
    form.reset(); 
  }

  if (typeof window !== 'undefined' && !localStorage.getItem('currentUserEmail')) {
      return <p className="text-muted-foreground text-center py-4">Please log in to edit your profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
        <Separator />
        
        <section className="space-y-6">
          <h3 className="text-lg font-medium text-foreground">Change PIN</h3>
          <FormField
            control={form.control}
            name="currentPin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current 6-Digit PIN</FormLabel>
                <FormControl>
                  <PinInput length={6} {...field} />
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
                <FormLabel>New 6-Digit PIN</FormLabel>
                <FormControl>
                  <PinInput length={6} {...field} />
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
                <FormLabel>Confirm New 6-Digit PIN</FormLabel>
                <FormControl>
                  <PinInput length={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
