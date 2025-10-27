"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageSquareText, PenTool, BookText, Workflow } from "lucide-react"; // Icons for features

const LandingPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: <MessageSquareText className="h-8 w-8 text-primary" />,
      title: "Conversational Legal Research",
      description: "Ask natural-language questions and get structured responses with citations from Indian case law.",
    },
    {
      icon: <PenTool className="h-8 w-8 text-primary" />,
      title: "AI-Assisted Drafting",
      description: "A smart writing canvas with a live copilot to auto-complete arguments and suggest precedents.",
    },
    {
      icon: <BookText className="h-8 w-8 text-primary" />,
      title: "Structured Responses & Citations",
      description: "Receive precise answers with direct links to relevant cases and legal documents.",
    },
    {
      icon: <Workflow className="h-8 w-8 text-primary" />,
      title: "Seamless Workflow Integration",
      description: "Move effortlessly from research to drafting, and export your work in standard legal formats.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center bg-background text-foreground">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Welcome to <span className="text-primary">JudgiAI</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Your AI partner for research, reasoning, and drafting in Indian law.
          </p>
          <Button onClick={handleSignInClick} size="lg" className="text-lg px-10 py-7 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            Sign In to Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 bg-muted/20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Unlock the Power of AI Legal Research & Drafting</h2>
          <p className="text-lg text-muted-foreground mb-12">
            JudgiAI streamlines your workflow from inquiry to export, saving you time and enhancing accuracy.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="flex flex-col items-center p-6 text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  {feature.icon}
                  <CardTitle className="mt-4 text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-20 md:py-28 text-center px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Transform Your Legal Practice?</h2>
          <p className="text-xl mb-10">
            Join JudgiAI today and experience the future of legal research and drafting.
          </p>
          <Button onClick={handleSignInClick} size="lg" variant="secondary" className="text-lg px-10 py-7 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            Get Started with JudgiAI
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-card text-card-foreground text-center text-sm border-t border-border px-4">
        <p>&copy; {new Date().getFullYear()} JudgiAI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPageContent;