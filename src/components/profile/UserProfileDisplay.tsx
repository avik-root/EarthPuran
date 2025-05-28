
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone } from "lucide-react";

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
}

const countriesMap: { [key: string]: string } = {
  "US": "+1",
  "CA": "+1",
  "GB": "+44",
  "AU": "+61",
  "IN": "+91",
};

export function UserProfileDisplay() {
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const storedData = localStorage.getItem('userProfilePrototype');
      if (storedData) {
        try {
          setProfileData(JSON.parse(storedData));
        } catch (error) {
          console.error("Failed to parse user profile data from localStorage", error);
          setProfileData(null);
        }
      }
      setLoading(false);
    }
  }, [hasMounted]);

  if (!hasMounted || loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Loading your personal details...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">User details not available. Please try logging in again.</p>
        </CardContent>
      </Card>
    );
  }

  const fullPhoneNumber = `${countriesMap[profileData.countryCode] || profileData.countryCode} ${profileData.phoneNumber}`;

  return (
    <Card className="mb-8 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Your Information</CardTitle>
        <CardDescription>Here are your personal details stored with Earth Puran.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center">
          <User className="h-5 w-5 mr-3 text-muted-foreground" />
          <div>
            <span className="font-medium text-foreground">Name:</span> {profileData.firstName} {profileData.lastName}
          </div>
        </div>
        <div className="flex items-center">
          <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
          <div>
            <span className="font-medium text-foreground">Email:</span> {profileData.email}
          </div>
        </div>
        <div className="flex items-center">
          <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
          <div>
            <span className="font-medium text-foreground">Phone:</span> {fullPhoneNumber}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
