"use client";

import React from "react";
import ChatInput from "./ChatInput";

interface InitialPromptProps {
  onSendMessage: (message: string) => void;
}

const InitialPrompt: React.FC<InitialPromptProps> = ({ onSendMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-semibold mb-8 text-foreground">What can I help with?</h1>
      <div className="w-full max-w-2xl">
        <ChatInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};

export default InitialPrompt;