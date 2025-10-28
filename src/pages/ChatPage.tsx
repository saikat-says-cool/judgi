"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const ChatPage = () => {
  const { supabase, session } = useSession();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect to handle conversation ID changes and fetch history
  useEffect(() => {
    const fetchChatHistory = async (convId: string) => {
      if (!session?.user?.id) {
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('chats')
        .select('id, role, content, created_at')
        .eq('user_id', session.user.id)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching chat history:", error);
        showError("Failed to load chat history.");
        setMessages([]);
      } else if (data) {
        setMessages(data as ChatMessage[]);
      }
      setLoadingHistory(false);
    };

    // Logic to prevent flickering when navigating from 'new' to a real ID
    if (conversationId === 'new') {
      // Only clear messages if we are truly starting fresh, not if we just navigated from 'new' to a real ID
      if (currentConversationId !== null) { // If we had an active conversation (even a temp one)
         setMessages([]); // Clear messages only if we are transitioning from an existing chat to a new blank one
      }
      setCurrentConversationId(null); // No active conversation yet
      setLoadingHistory(false);
    } else if (conversationId && conversationId !== currentConversationId) {
      // Only fetch if the conversationId in the URL has actually changed
      setCurrentConversationId(conversationId);
      fetchChatHistory(conversationId);
    } else if (!conversationId) {
      // If no conversationId in URL, default to new chat
      navigate('/app/chat/new', { replace: true });
    }
  }, [conversationId, session?.user?.id, supabase, navigate, currentConversationId]);

  const createNewConversation = useCallback(async (initialTitle: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to create a new chat.");
      return null;
    }
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: session.user.id, title: initialTitle })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating new conversation:", error);
      showError("Failed to start a new chat.");
      return null;
    }
    return data.id;
  }, [session?.user?.id, supabase]);

  const handleSendMessage = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to send messages.");
      return;
    }
    if (loadingAIResponse) {
      showError("Please wait for the current AI response to complete.");
      return;
    }

    if (inputMessage.trim()) {
      const userMessageContent = inputMessage.trim();
      let activeConversationId = currentConversationId;

      // If it's a new chat, create the conversation and save the first message
      if (!activeConversationId) {
        const initialTitle = userMessageContent.substring(0, 50) + (userMessageContent.length > 50 ? '...' : '');
        activeConversationId = await createNewConversation(initialTitle);
        if (!activeConversationId) return; // Failed to create conversation

        // Save the first user message to the newly created conversation
        const { data: userMessageData, error: userMessageError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            conversation_id: activeConversationId,
            role: 'user',
            content: userMessageContent,
          })
          .select('id, created_at')
          .single();

        if (userMessageError) {
          console.error("Error saving first user message to Supabase:", userMessageError);
          showError("Failed to save your message. Please try again.");
          setLoadingAIResponse(false);
          return;
        }

        // Now navigate to the new conversation ID
        setCurrentConversationId(activeConversationId);
        navigate(`/app/chat/${activeConversationId}`, { replace: true });

        // Add the message to local state after successful save and navigation
        setMessages([{
          id: userMessageData.id,
          role: 'user',
          content: userMessageContent,
          created_at: userMessageData.created_at,
        }]);

      } else {
        // For existing chats, add to local state immediately, then save
        const newUserMessage: ChatMessage = {
          id: Date.now().toString(), // Temporary ID for immediate display
          role: 'user',
          content: userMessageContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);

        const { data: userMessageData, error: userMessageError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            conversation_id: activeConversationId,
            role: newUserMessage.role,
            content: newUserMessage.content,
          })
          .select('id, created_at')
          .single();

        if (userMessageError) {
          console.error("Error saving user message to Supabase:", userMessageError);
          showError("Failed to save your message. Please try again.");
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id)); // Remove temp message
          setLoadingAIResponse(false);
          return;
        } else if (userMessageData) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newUserMessage.id ? { ...msg, id: userMessageData.id, created_at: userMessageData.created_at } : msg
            )
          );
        }
      }

      setInputMessage('');
      setLoadingAIResponse(true);

      // Prepare messages for AI, including the latest user message
      const messagesForAI = [...messages, { role: 'user', content: userMessageContent }];

      try {
        const aiResponseContent = await getLongCatCompletion(messagesForAI, {
          researchMode: 'none',
          deepthinkMode: false,
          userId: session.user.id,
        });

        const newAIMessage: ChatMessage = {
          id: Date.now().toString() + '-ai', // Temporary ID
          role: 'assistant',
          content: aiResponseContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, newAIMessage]);

        // Save AI message to Supabase
        const { data: aiMessageData, error: aiMessageError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            conversation_id: activeConversationId,
            role: newAIMessage.role,
            content: newAIMessage.content,
          })
          .select('id, created_at')
          .single();

        if (aiMessageError) {
          console.error("Error saving AI message to Supabase:", aiMessageError);
          showError("Failed to save AI response.");
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newAIMessage.id)); // Remove temp message
        } else if (aiMessageData) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === newAIMessage.id ? { ...msg, id: aiMessageData.id, created_at: aiMessageData.created_at } : msg
            )
          );
        }
      } catch (error) {
        console.error("Error getting AI response:", error);
        showError("Failed to get AI response. Please check your API key and network connection.");
        // If AI fails, remove the user message that was just sent if it was the first message in a new chat
        if (messages.length === 0 && !currentConversationId) { // This condition needs careful thought
             // If it was a new chat and AI failed, we might want to revert the conversation creation or mark it as failed.
             // For now, we'll just show an error. The user message is already saved.
        }
      } finally {
        setLoadingAIResponse(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !loadingAIResponse) {
      handleSendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <Card className="flex flex-col h-full items-center justify-center">
        <p className="text-muted-foreground">Loading chat history...</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 p-4"> {/* REMOVED h-full from here */}
            {messages.length === 0 && conversationId === 'new' ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground text-center py-10">
                <h3 className="text-xl font-semibold mb-2">Start a new conversation!</h3>
                <p>Ask JudgiAI a legal question to get started.</p>
              </div>
            ) : messages.length === 0 && conversationId !== 'new' ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground text-center py-10">
                <h3 className="text-xl font-semibold mb-2">This conversation is empty.</h3>
                <p>Start typing to continue.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {loadingAIResponse && (
              <div className="flex justify-start">
                <div className="max-w-[70%] p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>JudgiAI is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          className="flex-1"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loadingAIResponse}
        />
        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse}>
          {loadingAIResponse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;