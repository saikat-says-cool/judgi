"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-5xl font-bold text-foreground mb-4">Welcome to Judgi</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Your intelligent assistant for insightful conversations and quick answers.
      </p>
      <Button onClick={handleSignInClick} size="lg" className="text-lg px-8 py-6">
        Sign In to Get Started
      </Button>
    </div>
  );
};

export default LandingPage;