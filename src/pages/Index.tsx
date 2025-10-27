"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface Message {
  text: string;
  isUser: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! How can I help you today?", isUser: false },
  ]);

  const handleSendMessage = (text: string) => {
    const newUserMessage: Message = { text, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Simulate an AI response
    setTimeout(() => {
      const aiResponse: Message = { text: `You said: "${text}"`, isUser: false };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ChatLayout inputArea={<ChatInput onSendMessage={handleSendMessage} />}>
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
        ))}
      </ChatLayout>
      <MadeWithDyad />
    </div>
  );
};

export default Index;