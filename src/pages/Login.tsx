"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession } from '@/contexts/SessionContext';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  const { supabase } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Welcome to Dyad Chat</h1>
        <div className="p-6 rounded-lg shadow-lg bg-card">
          <Auth
            supabaseClient={supabase}
            providers={[]} // You can add 'google', 'github', etc. here if desired
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Or "dark" based on your app's theme
            redirectTo={window.location.origin} // Redirects to the current origin after auth
          />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;