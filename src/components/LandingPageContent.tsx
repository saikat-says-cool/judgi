"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageSquareText, PenTool, BookText, Workflow, Lightbulb, Scale, ShieldCheck } from "lucide-react"; // Added more icons

const LandingPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: <MessageSquareText className="h-8 w-8 text-primary" />,
      title: "Conversational Legal Research",
      description: "Engage with Indian case law like never before. Ask complex legal questions in natural language and receive precise, context-aware answers, complete with direct citations and summaries. No more endless keyword searches – just intelligent, intuitive research.",
    },
    {
      icon: <PenTool className="h-8 w-8 text-primary" />,
      title: "AI-Assisted Drafting Canvas",
      description: "Revolutionize your document creation. Our smart writing canvas features a live AI copilot that auto-completes arguments, suggests relevant precedents, and helps reformat drafts into perfect legal language. From petitions to summaries, draft with unprecedented speed and accuracy.",
    },
    {
      icon: <BookText className="h-8 w-8 text-primary" />,
      title: "Structured Responses & Citations",
      description: "Every answer from JudgiAI is meticulously structured, providing clear, concise information. Get direct links to original case documents and legal texts, ensuring the highest level of accuracy and verifiability for your research.",
    },
    {
      icon: <Workflow className="h-8 w-8 text-primary" />,
      title: "Seamless Workflow Integration",
      description: "Experience a truly integrated legal workflow. Move effortlessly from in-depth research to drafting, and export your final work in standard legal formats like .docx or .pdf with a single click. JudgiAI is designed to fit seamlessly into your existing practice.",
    },
  ];

  const benefits = [
    {
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
      title: "Boost Efficiency",
      description: "Cut down research time by up to 70%. Focus on strategy, not endless document sifting.",
    },
    {
      icon: <Scale className="h-6 w-6 text-primary" />,
      title: "Enhance Accuracy",
      description: "Leverage AI to uncover nuanced precedents and avoid critical omissions.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: "Streamline Drafting",
      description: "Generate high-quality legal documents faster with intelligent suggestions and formatting.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center bg-background text-foreground">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-40 text-center px-4 bg-gradient-to-b from-background to-muted/10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Transform Your Legal Practice with <span className="text-primary">JudgiAI</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto">
            Your intelligent AI partner for unparalleled legal research, precise reasoning, and effortless drafting in Indian law.
          </p>
          <Button onClick={handleSignInClick} size="lg" className="text-lg px-12 py-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            Start Your Free Trial Today
          </Button>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="w-full py-16 md:py-24 bg-card/50 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">The Challenges of Modern Legal Practice</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Legal professionals spend countless hours on manual research and repetitive drafting. Traditional tools are rigid, leading to inefficiencies and missed opportunities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <Lightbulb className="h-8 w-8 text-destructive mb-3" />
                <CardTitle className="text-xl font-semibold">Time-Consuming Research</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Hours lost sifting through irrelevant documents with keyword-based searches.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <Scale className="h-8 w-8 text-destructive mb-3" />
                <CardTitle className="text-xl font-semibold">Contextual Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Traditional tools lack contextual understanding, leading to missed precedents.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <PenTool className="h-8 w-8 text-destructive mb-3" />
                <CardTitle className="text-xl font-semibold">Inefficient Drafting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Manual drafting and reformatting consume valuable time and resources.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24 bg-muted/20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">How JudgiAI Empowers You</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            JudgiAI integrates cutting-edge AI to streamline your entire legal workflow, from initial inquiry to final document export.
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

      {/* Benefits Section */}
      <section className="w-full py-16 md:py-24 bg-card/50 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">The JudgiAI Advantage</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Discover how JudgiAI can transform your daily legal tasks, giving you more time for what truly matters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="flex flex-col items-center p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  {benefit.icon}
                  <CardTitle className="mt-4 text-xl font-semibold">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">{benefit.description}</CardDescription>
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
            Join the future of legal tech. Sign up for JudgiAI today and experience unparalleled efficiency and accuracy.
          </p>
          <Button onClick={handleSignInClick} size="lg" variant="secondary" className="text-lg px-12 py-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
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