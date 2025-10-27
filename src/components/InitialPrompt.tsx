"use client";

import React from "react";
import ChatInput from "./ChatInput";

interface InitialPromptProps {
  onSendMessage: (message: string) => void;
}

const InitialPrompt: React.FC<InitialPromptProps> = ({ onSendMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-2 text-foreground">How can I help today?</h1>
      <p className="text-muted-foreground mb-8">Type a command or ask a question</p>
      <div className="w-full max-w-2xl">
        <ChatInput onSendMessage={onSendMessage} placeholder="Ask judgi a question..." />
      </div>
    </div>
  );
};

export default InitialPrompt;