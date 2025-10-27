"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import InitialPrompt from "@/components/InitialPrompt"; // Import the new component
import { MadeWithDyad } from "@/components/made-with-dyad";

interface Message {
  text: string;
  isUser: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasChatStarted, setHasChatStarted] = useState(false);

  const handleSendMessage = (text: string) => {
    const newUserMessage: Message = { text, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    if (!hasChatStarted) {
      setHasChatStarted(true);
      // Add the initial AI message only after the first user message
      setMessages((prev) => [...prev, { text: "Hello! How can I help you today?", isUser: false }]);
    }

    // Simulate an AI response
    setTimeout(() => {
      const aiResponse: Message = { text: `You said: "${text}"`, isUser: false };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {hasChatStarted ? (
        <ChatLayout inputArea={<ChatInput onSendMessage={handleSendMessage} />}>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
          ))}
        </ChatLayout>
      ) : (
        <InitialPrompt onSendMessage={handleSendMessage} />
      )}
      <MadeWithDyad />
    </div>
  );
};

export default Index;