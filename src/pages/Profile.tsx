"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { showError, showSuccess } from "@/utils/toast";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null; // Add country to profile data
}

const countries = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Brazil", label: "Brazil" },
  { value: "South Africa", label: "South Africa" },
];

const Profile = () => {
  const { supabase, session } = useSession();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [country, setCountry] = useState<string>(""); // New state for country
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) {
        navigate("/login");
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, country") // Select country
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        showError("Failed to load profile data.");
      } else if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setCountry(data.country || ""); // Set country from fetched data
      }
      setEmail(session.user.email || "");
      setLoading(false);
    };

    fetchProfile();
  }, [session, supabase, navigate]);

  const handleUpdateProfile = async () => {
    if (!session?.user) {
      showError("You must be logged in to update your profile.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ 
        first_name: firstName, 
        last_name: lastName, 
        country: country, // Update country
        updated_at: new Date().toISOString() 
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("Error updating profile:", error);
      showError("Failed to update profile.");
    } else {
      showSuccess("Profile updated successfully!");
    }
    setIsUpdating(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      showError("Failed to log out.");
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>View and manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateProfile} className="w-full" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
          <Button onClick={handleLogout} className="w-full" variant="destructive">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;