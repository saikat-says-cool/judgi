"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface SessionContextType {
  supabase: typeof supabase;
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          navigate('/app'); // Corrected redirect to /app on sign in
        } else if (event === 'SIGNED_OUT') {
          navigate('/login'); // Redirect to login page on sign out
        } else if (event === 'AUTH_API_ERROR') {
          showError("Authentication error. Please try again.");
          console.error("Supabase Auth API Error:", currentSession);
        }
      }
    );

    // Fetch initial session without immediate navigation
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ supabase, session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};