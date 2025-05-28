
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone } from "lucide-react";
import type { UserProfile } from '@/types/userData';
import { getUserData } from '@/app/actions/userActions';
import { useToast } from '@/hooks/use-toast';

const countriesMap: { [key: string]: string } = {
  "US": "+1",
  "CA": "+1",
  "GB": "+44",
  "AU": "+61",
  "IN": "+91",
};

export function UserProfileDisplay() {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false); 
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      setCurrentUserEmail(localStorage.getItem('currentUserEmail'));
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!hasMounted || !currentUserEmail) {
        setProfileData(null); // Clear profile if no user
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const userData = await getUserData(currentUserEmail);
      if (userData && userData.profile) {
        setProfileData(userData.profile);
      } else {
        const storedProfile = localStorage.getItem('userProfilePrototype'); // Fallback
        if (storedProfile) {
            setProfileData(JSON.parse(storedProfile));
        } else {
            setProfileData(null);
        }
      }
    } catch (error) {
      console.error("Failed to load user profile data:", error);
      setProfileData(null);
      toast({ title: "Error", description: "Could not load your profile information.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [hasMounted, currentUserEmail, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


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
  
  if (!currentUserEmail && !loading && hasMounted) { // Added hasMounted to avoid flash of this on initial load
    return (
      <Card className="mb-8">
        <CardHeader><CardTitle>Your Information</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Please log in to view your profile.</p></CardContent>
      </Card>
    );
  }


  if (!profileData && hasMounted) { // Added hasMounted
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">User details not available. Please try logging in again or ensure your profile is complete.</p>
        </CardContent>
      </Card>
    );
  }

  // Render profile data only if it exists
  if (profileData) {
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
  
  return null; // Return null if no conditions are met (should ideally be caught by loading or no-user states)
}
