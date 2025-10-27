"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatLayout from "@/components/ChatLayout";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import InitialPrompt from "@/components/InitialPrompt";
import { getLongCatCompletion } from "@/services/longcatApi";
import { showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { useChatModes } from "@/contexts/ChatModeContext"; // Import useChatModes
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import Sidebar from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/LoadingSpinner"; // Import LoadingSpinner

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
  const { researchMode, deepthinkMode } = useChatModes(); // Use chat modes
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasChatStarted, setHasChatStarted] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
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
          title: chat.content.substring(0, 50) + (chat.content.length > 50 ? "..." : ""),
        });
      }
    });
    return Array.from(conversationMap.values());
  }, []);

  const loadConversationMessages = useCallback(async (convId: string) => {
    setIsAiResponding(true);
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

  useEffect(() => {
    if (!isSessionLoading && session) {
      const initializeChat = async () => {
        setIsAiResponding(true);
        try {
          const fetchedConversations = await fetchConversations(session.user.id);
          setConversations(fetchedConversations);

          // Always start a new chat on load/sign-in
          const newConvId = uuidv4();
          setConversationId(newConvId);
          setMessages([]);
          setHasChatStarted(false);
          // Add the new chat to the conversations list if it's not already there
          if (!fetchedConversations.some(conv => conv.id === newConvId)) {
            setConversations(prev => [{ id: newConvId, title: "New Chat" }, ...prev]);
          }
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
  }, [session, isSessionLoading, fetchConversations]);

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
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, title: text.substring(0, 50) + (text.length > 50 ? "..." : "") } : conv
      ));
    }

    setIsAiResponding(true);

    try {
      const apiMessages = [...messages, newUserMessage].map(msg => ({
        role: msg.role,
        content: msg.text,
      }));

      // Pass the current chat modes to the AI completion function
      const aiResponseText = await getLongCatCompletion(apiMessages, { researchMode, deepthinkMode });
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

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!session) {
      showError("Please log in to rename a chat.");
      return;
    }
    const { error } = await supabase
      .from('chats')
      .update({ content: newTitle })
      .eq('conversation_id', id)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error("Error renaming conversation:", error);
      showError("Failed to rename conversation.");
    } else {
      if (session) {
        const updatedConversations = await fetchConversations(session.user.id);
        setConversations(updatedConversations);
      }
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!session) {
      showError("Please log in to delete a chat.");
      return;
    }
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('conversation_id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error deleting conversation:", error);
      showError("Failed to delete conversation.");
    } else {
      if (conversationId === id) {
        const newConvId = uuidv4();
        setConversationId(newConvId);
        setMessages([]);
        setHasChatStarted(false);
      }
      if (session) {
        const updatedConversations = await fetchConversations(session.user.id);
        setConversations(updatedConversations);
      }
    }
  };

  const currentChatTitle = useMemo(() => {
    if (!conversationId) return "New Chat";
    const activeConversation = conversations.find(conv => conv.id === conversationId);
    return activeConversation?.title || "New Chat";
  }, [conversationId, conversations]);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        currentConversationId={conversationId}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(prev => !prev)}
      />
      <div className={`flex-grow flex flex-col ${isDesktopSidebarOpen && !isMobile ? "md:ml-0" : "md:ml-0"}`}>
        {hasChatStarted && conversationId ? (
          <ChatLayout
            key={conversationId}
            inputArea={<ChatInput onSendMessage={handleSendMessage} />}
            onToggleSidebar={() => setIsDesktopSidebarOpen(prev => !prev)}
            currentChatTitle={currentChatTitle}
            className="animate-in fade-in zoom-in-95 duration-500 ease-out"
          >
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg.text} isUser={msg.role === "user"} />
            ))}
            {isAiResponding && (
              <LoadingSpinner />
            )}
          </ChatLayout>
        ) : (
          <InitialPrompt onSendMessage={handleSendMessage} />
        )}
      </div>
    </div>
  );
};

export default Index;