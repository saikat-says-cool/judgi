"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession } from '@/contexts/SessionContext';
// Removed useTheme import

const Login = () => {
  const { supabase, isLoading } = useSession();
  // Removed theme variable

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Welcome to Dyad App</h1>
        <div className="p-6 rounded-lg shadow-lg bg-card">
          <Auth
            supabaseClient={supabase}
            providers={['google']} // Added Google provider
            appearance={{
              theme: ThemeSupa,
            }}
            theme="dark" // Hardcoded to dark theme
          />
        </div>
      </div>
    </div>
  );
};

export default Login;