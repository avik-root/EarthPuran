
"use client";

import { useState }
from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, MapPin, ListOrdered, Heart } from "lucide-react";
import Link from "next/link";

// Form components (will be created in separate files)
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { AddressManagement } from "@/components/profile/AddressManagement";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <User className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and view your activity.</p>
        </div>
      </div>

      <Tabs defaultValue="edit-profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="edit-profile" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <Lock className="h-4 w-4" /> Edit Profile
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm">
            <MapPin className="h-4 w-4" /> Addresses
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm" asChild>
            <Link href="/orders"><ListOrdered className="h-4 w-4 mr-0 sm:mr-2" />Order History</Link>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex flex-col sm:flex-row items-center gap-2 py-2 px-3 text-xs sm:text-sm" asChild>
            <Link href="/wishlist"><Heart className="h-4 w-4 mr-0 sm:mr-2" />Wishlist</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit-profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile Information</CardTitle>
              <CardDescription>Update your password and security PIN.</CardDescription>
            </CardHeader>
            <CardContent>
              <EditProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Delivery Addresses</CardTitle>
              <CardDescription>Add, edit, or remove your shipping addresses.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddressManagement />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content for Orders and Wishlist are handled by linking to their respective pages */}
         <TabsContent value="orders">
          {/* This content won't be directly shown as the trigger is a Link */}
        </TabsContent>
         <TabsContent value="wishlist">
           {/* This content won't be directly shown as the trigger is a Link */}
        </TabsContent>

      </Tabs>
    </div>
  );
}
