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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle background squares */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-[size:30px_30px] bg-[repeating-linear-gradient(0deg,hsl(var(--square-pattern-color))_0,hsl(var(--square-pattern-color))_1px,transparent_1px,transparent_30px),repeating-linear-gradient(90deg,hsl(var(--square-pattern-color))_0,hsl(var(--square-pattern-color))_1px,transparent_1px,transparent_30px)]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Welcome to JudgiAI</h1>
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