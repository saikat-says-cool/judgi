"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
// import ChatModes from "./ChatModes"; // Removed ChatModes

interface ChatLayoutProps {
  children: React.ReactNode;
  inputArea: React.ReactNode;
  onToggleSidebar?: () => void;
  currentChatTitle: string | null;
  className?: string;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children, inputArea, onToggleSidebar, currentChatTitle, className }) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("flex flex-col h-full w-full max-w-4xl mx-auto p-4", className)}>
      <Card className="flex flex-col flex-grow">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {!isMobile && onToggleSidebar && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <CardTitle className="text-xl">{currentChatTitle || "New Chat"}</CardTitle>
          </div>
        </CardHeader>
        {/* ChatModes removed from here */}
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4 h-0"> {/* Added h-0 here */}
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