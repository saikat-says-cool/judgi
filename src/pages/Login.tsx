"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from 'next-themes'; // Import useTheme

const Login = () => {
  const { supabase, isLoading } = useSession();
  const { theme } = useTheme(); // Get current theme

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
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
                dark: {
                  colors: {
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputForeground: 'hsl(var(--foreground))',
                    inputText: 'hsl(var(--foreground))',
                  },
                },
              },
            }}
            theme={theme === 'dark' ? 'dark' : 'light'} // Dynamically set theme
          />
        </div>
      </div>
    </div>
  );
};

export default Login;