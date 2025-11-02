"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client'; // Import the singleton client

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
        console.log("Supabase Auth State Change:", event, currentSession?.user?.id); // Added console log
        setSession(currentSession);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          navigate('/app');
        } else if (event === 'SIGNED_OUT') {
          navigate('/login');
        } 
        // Removed else if (event === 'AUTH_API_ERROR') as it's not a valid event type for onAuthStateChange
        // Auth API errors are typically handled by the Auth UI component or caught in specific API calls.
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