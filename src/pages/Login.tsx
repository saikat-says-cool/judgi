"use client";

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { supabase, session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/chat'); // Redirect to chat if already logged in
    }
  }, [session, isLoading, navigate]);

  if (isLoading || session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p> {/* Or a proper loading spinner */}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Welcome to JudgiAI</h1>
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
              },
            }}
            theme="light"
            // redirectTo="/chat" // Removed this, as SessionContext handles it
          />
        </div>
      </div>
    </div>
  );
};

export default Login;