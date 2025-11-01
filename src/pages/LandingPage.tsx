"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText, Workflow, Lightbulb, ShieldCheck, Rocket } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle background squares */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="w-full h-full bg-[size:30px_30px] bg-[repeating-linear-gradient(0deg,hsl(var(--square-pattern-color))_0,hsl(var(--square-pattern-color))_1px,transparent_1px,transparent_30px),repeating-linear-gradient(90deg,hsl(var(--square-pattern-color))_0,hsl(var(--square-pattern-color))_1px,transparent_1px,transparent_30px)]"></div>
      </div>

      <div className="text-center max-w-4xl mx-auto py-16 z-10">
        <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">
          🚀 Elevate Your Legal Practice
        </Badge>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          JudgiAI: Your AI Partner for Legal Research, Reasoning, and Drafting.
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
          Streamline your legal workflow from inquiry to export with intelligent AI assistance. JudgiAI empowers legal professionals and students to achieve unmatched efficiency and precision.
        </p>
        <Button
          size="lg"
          onClick={() => navigate('/login')}
          className="px-10 py-6 text-lg sm:text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Get Started with JudgiAI
        </Button>
      </div>

      <section className="w-full max-w-6xl mx-auto py-16 z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Unlock Your Legal Potential</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-6 text-center bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-col items-center pb-4">
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold">Intelligent Legal Research</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Ask complex legal questions in natural language. Get structured responses with citations, case summaries, and deep analysis. Explore 'Quick Lookup', 'Deep Think', and 'Deeper Research' modes for tailored insights.
            </CardContent>
          </Card>

          <Card className="p-6 text-center bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-col items-center pb-4">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold">AI-Powered Drafting Canvas</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Draft legal documents with a smart writing assistant. Auto-complete arguments, suggest precedents, reformat drafts, and generate footnotes. Export your work to DOCX or PDF with a single click.
            </CardContent>
          </Card>

          <Card className="p-6 text-center bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-col items-center pb-4">
              <Workflow className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl font-semibold">Seamless Integrated Workflow</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Move effortlessly between research and drafting. Save findings directly from chat to your canvas. JudgiAI brings all your legal tasks into one intuitive, powerful platform.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto py-16 bg-muted/20 rounded-lg shadow-inner z-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why Choose JudgiAI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          <div className="flex items-start space-x-4">
            <Lightbulb className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Contextual Intelligence</h3>
              <p className="text-muted-foreground text-sm">Our AI understands the nuances of legal language and provides highly relevant, context-aware responses.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Secure & Private</h3>
              <p className="text-muted-foreground text-sm">Built on Supabase, your data is secure with robust authentication and Row Level Security.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Rocket className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Boost Productivity</h3>
              <p className="text-muted-foreground text-sm">Cut down research time and accelerate drafting, allowing you to focus on strategic legal work.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <MessageSquare className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Conversational Interface</h3>
              <p className="text-muted-foreground text-sm">Interact with AI naturally, just like talking to a colleague, but with instant access to vast legal knowledge.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <FileText className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Flexible Document Export</h3>
              <p className="text-muted-foreground text-sm">Easily export your drafted documents to industry-standard DOCX and PDF formats.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Workflow className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-1">Always Up-to-Date</h3>
              <p className="text-muted-foreground text-sm">Leveraging cutting-edge AI and research APIs to provide the most current information.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="text-center max-w-4xl mx-auto py-16 z-10">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Ready to Transform Your Legal Workflow?</h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
          Join the future of legal practice. Sign up today and experience the power of AI at your fingertips.
        </p>
        <Button
          size="lg"
          onClick={() => navigate('/login')}
          className="px-10 py-6 text-lg sm:text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Start Your Free Trial
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;