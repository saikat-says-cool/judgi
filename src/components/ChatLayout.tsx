"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ChatLayoutProps {
  children: React.ReactNode;
  inputArea: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children, inputArea }) => {
  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto p-4">
      <Card className="flex flex-col flex-grow">
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-xl">Dyad Chat</CardTitle>
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