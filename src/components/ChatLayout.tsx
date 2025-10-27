"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatLayoutProps {
  children: React.ReactNode;
  inputArea: React.ReactNode;
  onToggleSidebar?: () => void; // New prop for sidebar toggle
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children, inputArea, onToggleSidebar }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto p-4">
      <Card className="flex flex-col flex-grow">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {!isMobile && onToggleSidebar && ( // Show toggle button only on desktop
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <CardTitle className="text-xl">Dyad Chat</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {children}
        </CardContent>
        <Separator />
        <div className="p-4">
          {inputArea}
        </div>
      </Card>
    </div>
  );
};

export default ChatLayout;