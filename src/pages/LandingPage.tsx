"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useSession();

  // If already logged in, redirect to the main app
  useEffect(() => {
    if (!isLoading && session) {
      navigate('/app');
    }
  }, [isLoading, session, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight mb-6">
          Welcome to JudgiAI
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your intelligent legal assistant. Get started by logging in or signing up.
        </p>
        <Button
          size="lg"
          onClick={() => navigate('/login')}
          className="px-8 py-4 text-lg"
        >
          Login / Sign Up
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;