"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import InitialPrompt from "@/components/InitialPrompt";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { getLongCatCompletion } from "@/services/longcatApi"; // Import the new API service
import { showLoading, dismissToast, showError } from "@/utils/toast"; // For loading and error feedback

interface Message {
  text: string;
  role: "user" | "assistant"; // Changed from isUser: boolean to role
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = { text, role: "user" };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    if (!hasChatStarted) {
      setHasChatStarted(true);
    }

    setIsLoading(true);
    const loadingToastId = showLoading("Getting AI response...");

    try {
      // Convert current messages to the format expected by the LongCat API
      const apiMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      const aiResponseText = await getLongCatCompletion(apiMessages);
      const aiResponse: Message = { text: aiResponseText, role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      showError("Failed to get AI response. Please try again.");
      const errorMessage: Message = { text: "Sorry, I couldn't get a response from the AI. Please try again.", role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      dismissToast(loadingToastId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {hasChatStarted ? (
        <ChatLayout inputArea={<ChatInput onSendMessage={handleSendMessage} />}>
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg.text} isUser={msg.role === "user"} />
          ))}
          {isLoading && (
            <ChatMessage message="AI is thinking..." isUser={false} />
          )}
        </ChatLayout>
      ) : (
        <InitialPrompt onSendMessage={handleSendMessage} />
      )}
      <MadeWithDyad />
    </div>
  );
};

export default Index;