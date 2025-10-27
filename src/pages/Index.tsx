"use client";

import React, { useState, useEffect, useCallback } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import InitialPrompt from "@/components/InitialPrompt";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { getLongCatCompletion } from "@/services/longcatApi";
import { showLoading, dismissToast, showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import Sidebar from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  text: string;
  role: "user" | "assistant";
}

interface ConversationSummary {
  id: string;
  title: string;
}

const Index = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false); // Renamed from isLoading to be more specific
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const isMobile = useIsMobile();

  const fetchConversations = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('conversation_id, content, created_at')
      .eq('user_id', userId)
      .order('conversation_id', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching conversations:", error);
      showError("Failed to load conversations.");
      return [];
    }

    const conversationMap = new Map<string, ConversationSummary>();
    data.forEach(chat => {
      if (!conversationMap.has(chat.conversation_id)) {
        conversationMap.set(chat.conversation_id, {
          id: chat.conversation_id,
          title: chat.content.substring(0, 50) + (chat.content.length > 50 ? "..." : ""), // Use first message as title
        });
      }
    });
    return Array.from(conversationMap.values());
  }, []);

  const loadConversationMessages = useCallback(async (convId: string) => {
    setIsAiResponding(true); // Use isAiResponding for loading messages too
    try {
      const { data: chatMessages, error: messagesError } = await supabase
        .from('chats')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages.map(msg => ({ text: msg.content, role: msg.role as "user" | "assistant" })));
        setHasChatStarted(true);
      } else {
        setMessages([]);
        setHasChatStarted(false);
      }
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      showError("Failed to load chat messages.");
      setMessages([]);
      setHasChatStarted(false);
    } finally {
      setIsAiResponding(false);
    }
  }, []);

  // Effect to load messages and conversations when session is ready
  useEffect(() => {
    if (!isSessionLoading && session) {
      const initializeChat = async () => {
        setIsAiResponding(true); // Use isAiResponding for initial chat loading
        try {
          const fetchedConversations = await fetchConversations(session.user.id);
          setConversations(fetchedConversations);

          let currentConvId: string | null = null;
          if (fetchedConversations.length > 0) {
            // Load the most recent conversation by default
            currentConvId = fetchedConversations[0].id;
            await loadConversationMessages(currentConvId);
          } else {
            // If no existing conversations, start a new one
            currentConvId = uuidv4();
            setMessages([]);
            setHasChatStarted(false);
          }
          setConversationId(currentConvId);
        } catch (error) {
          console.error("Error initializing chat:", error);
          showError("Failed to initialize chat.");
        } finally {
          setIsAiResponding(false);
        }
      };
      initializeChat();
    } else if (!isSessionLoading && !session) {
      setConversationId(null);
      setMessages([]);
      setHasChatStarted(false);
      setConversations([]);
    }
  }, [session, isSessionLoading, fetchConversations, loadConversationMessages]);

  const saveMessage = async (message: Message, currentConvId: string) => {
    if (!session) {
      console.error("Cannot save message: User not authenticated.");
      return;
    }
    const { error } = await supabase.from('chats').insert({
      user_id: session.user.id,
      conversation_id: currentConvId,
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
      // After first message, refresh conversations to show the new one
      if (session) {
        const updatedConversations = await fetchConversations(session.user.id);
        setConversations(updatedConversations);
      }
    }

    setIsAiResponding(true); // Use isAiResponding when AI is processing
    const loadingToastId = showLoading("Getting AI response...");

    try {
      const apiMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      const aiResponseText = await getLongCatCompletion(apiMessages);
      const aiResponse: Message = { text: aiResponseText, role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      await saveMessage(aiResponse, conversationId);
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      showError("Failed to get AI response. Please try again.");
      const errorMessage: Message = { text: "Sorry, I couldn't get a response from the AI. Please try again.", role: "assistant" };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      await saveMessage(errorMessage, conversationId);
    } finally {
      dismissToast(String(loadingToastId));
      setIsAiResponding(false);
    }
  };

  const handleSelectConversation = async (id: string) => {
    if (id === conversationId) return;
    setConversationId(id);
    await loadConversationMessages(id);
  };

  const handleNewConversation = async () => {
    if (!session) {
      showError("Please log in to start a new chat.");
      return;
    }
    const newConvId = uuidv4();
    setConversationId(newConvId);
    setMessages([]);
    setHasChatStarted(false);
    setConversations(prev => [{ id: newConvId, title: "New Chat" }, ...prev]);
  };

  // Only show full page loading for initial session loading
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return null; // SessionContextProvider will handle redirect to login
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        currentConversationId={conversationId}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(prev => !prev)}
      />
      <div className={`flex-grow flex flex-col ${isDesktopSidebarOpen && !isMobile ? "md:ml-0" : "md:ml-0"}`}>
        {hasChatStarted && conversationId ? (
          <ChatLayout
            inputArea={<ChatInput onSendMessage={handleSendMessage} />}
            onToggleSidebar={() => setIsDesktopSidebarOpen(prev => !prev)}
          >
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg.text} isUser={msg.role === "user"} />
            ))}
            {isAiResponding && ( // Use isAiResponding here
              <ChatMessage message="AI is thinking..." isUser={false} />
            )}
          </ChatLayout>
        ) : (
          <InitialPrompt onSendMessage={handleSendMessage} />
        )}
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Index;