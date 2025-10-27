"use client";

import React, { useState, useEffect } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import InitialPrompt from "@/components/InitialPrompt";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { getLongCatCompletion } from "@/services/longcatApi";
import { showLoading, dismissToast, showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext"; // Import useSession
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { v4 as uuidv4 } from 'uuid'; // For generating conversation IDs

interface Message {
  text: string;
  role: "user" | "assistant";
}

const Index = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null); // New state for conversation ID

  // Effect to load messages or start a new conversation when session is ready
  useEffect(() => {
    if (!isSessionLoading && session) {
      const fetchOrCreateConversation = async () => {
        setIsLoading(true);
        try {
          // Try to fetch the most recent conversation for the user
          const { data: latestChat, error: fetchError } = await supabase
            .from('chats')
            .select('conversation_id')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          let currentConversationId = latestChat?.[0]?.conversation_id;

          if (!currentConversationId) {
            // If no existing conversation, create a new one
            currentConversationId = uuidv4();
            setHasChatStarted(false); // Reset if starting a new conversation
          } else {
            // If existing conversation, load its messages
            const { data: chatMessages, error: messagesError } = await supabase
              .from('chats')
              .select('role, content')
              .eq('conversation_id', currentConversationId)
              .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;
            if (chatMessages && chatMessages.length > 0) {
              setMessages(chatMessages.map(msg => ({ text: msg.content, role: msg.role as "user" | "assistant" })));
              setHasChatStarted(true);
            }
          }
          setConversationId(currentConversationId);
        } catch (error) {
          console.error("Error fetching or creating conversation:", error);
          showError("Failed to load chat history.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrCreateConversation();
    } else if (!isSessionLoading && !session) {
      // If not logged in, ensure no conversation is active
      setConversationId(null);
      setMessages([]);
      setHasChatStarted(false);
    }
  }, [session, isSessionLoading]);

  const saveMessage = async (message: Message, currentConversationId: string) => {
    if (!session) {
      console.error("Cannot save message: User not authenticated.");
      return;
    }
    const { error } = await supabase.from('chats').insert({
      user_id: session.user.id,
      conversation_id: currentConversationId,
      role: message.role,
      content: message.text,
    });
    if (error) {
      console.error("Error saving message to Supabase:", error);
      showError("Failed to save message.");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!session || !conversationId) {
      showError("Please log in to start a chat.");
      return;
    }

    const newUserMessage: Message = { text, role: "user" };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    await saveMessage(newUserMessage, conversationId);

    if (!hasChatStarted) {
      setHasChatStarted(true);
    }

    setIsLoading(true);
    const loadingToastId = showLoading("Getting AI response...");

    try {
      // Include all current messages (including the new user message) for context
      const apiMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      const aiResponseText = await getLongCatCompletion(apiMessages);
      const aiResponse: Message = { text: aiResponseText, role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      await saveMessage(aiResponse, conversationId); // Save AI response
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      showError("Failed to get AI response. Please try again.");
      const errorMessage: Message = { text: "Sorry, I couldn't get a response from the AI. Please try again.", role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      await saveMessage(errorMessage, conversationId); // Save error message
    } finally {
      dismissToast(String(loadingToastId));
      setIsLoading(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    // If not logged in, the SessionContextProvider will redirect to /login
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {hasChatStarted && conversationId ? (
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