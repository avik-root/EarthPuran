
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
// import { updateUserProfile } from "@/app/actions/userActions"; // For actual profile updates

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const editProfileSchema = z.object({
  // For prototype, we'll focus on PIN change. Password change is complex without real auth.
  // currentPassword: z.string().min(1, "Current password is required."),
  // newPassword: passwordSchema,
  // confirmNewPassword: z.string(),
  currentPin: z.string().length(6, "Current PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
  newPin: z.string().length(6, "New PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
  confirmNewPin: z.string().length(6, "Confirm PIN must be 6 digits.").regex(/^\d+$/, "PIN must be numeric."),
})
// .refine(data => data.newPassword === data.confirmNewPassword, {
//   message: "New passwords don't match.",
//   path: ["confirmNewPassword"],
// })
.refine(data => data.newPin === data.confirmNewPin, {
  message: "New PINs don't match.",
  path: ["confirmNewPin"],
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileForm() {
  const { toast } = useToast();
  // const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  // const [showNewPassword, setShowNewPassword] = useState(false);
  // const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('currentUserEmail'));
    }
  }, []);


  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      // currentPassword: "",
      // newPassword: "",
      // confirmNewPassword: "",
      currentPin: "",
      newPin: "",
      confirmNewPin: "",
    },
  });

  async function onSubmit(values: EditProfileFormValues) {
    if (!currentUserEmail) {
        toast({ title: "Error", description: "You must be logged in to change security settings.", variant: "destructive"});
        return;
    }
    console.log("Edit profile form submitted (PIN change for now):", values);
    // In a real app:
    // 1. Verify currentPin against stored hashed PIN for currentUserEmail.
    // 2. If valid, hash newPin and call an action like:
    //    await updateUserSecurity(currentUserEmail, { newHashedPin: ... });
    // For this prototype, we'll just show a success message.
    // Password update logic would also call an action like updateUserProfile or a specific changePassword action.
    
    toast({ title: "PIN Updated (Simulated)", description: "Your PIN has been successfully updated." });
    form.reset(); 
  }

  if (typeof window !== 'undefined' && !localStorage.getItem('currentUserEmail')) {
      return <p className="text-muted-foreground text-center py-4">Please log in to edit your profile.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Password change section commented out for prototype simplicity */}
        {/* 
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
        */}

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
