"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react'; // Import Loader2 for loading indicator
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi'; // Import the LongCat API service

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const ChatPage = () => {
  const { supabase, session } = useSession();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingAIResponse, setLoadingAIResponse] = useState(false); // New state for AI loading
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!session?.user?.id) {
        setLoadingHistory(false);
        return;
      }

      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('chats')
        .select('id, role, content, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching chat history:", error);
        showError("Failed to load chat history.");
      } else if (data) {
        setMessages(data as ChatMessage[]);
      }
      setLoadingHistory(false);
    };

    fetchChatHistory();
  }, [session?.user?.id, supabase]);

  const handleSendMessage = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to send messages.");
      return;
    }
    if (loadingAIResponse) { // Prevent sending new messages while AI is responding
      showError("Please wait for the current AI response to complete.");
      return;
    }

    if (inputMessage.trim()) {
      const userMessageContent = inputMessage.trim();
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID for UI
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInputMessage('');
      setLoadingAIResponse(true); // Start AI loading

      // Store user message in Supabase
      const { data: userMessageData, error: userMessageError } = await supabase
        .from('chats')
        .insert({
          user_id: session.user.id,
          role: newUserMessage.role,
          content: newUserMessage.content,
        })
        .select('id, created_at')
        .single();

      if (userMessageError) {
        console.error("Error saving user message to Supabase:", userMessageError);
        showError("Failed to save your message. Please try again.");
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id));
        setLoadingAIResponse(false);
        return;
      } else if (userMessageData) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newUserMessage.id ? { ...msg, id: userMessageData.id, created_at: userMessageData.created_at } : msg
          )
        );
      }

      // Prepare messages for LongCat API (excluding temporary IDs)
      const messagesForAI = messages.map(msg => ({ role: msg.role, content: msg.content }));
      messagesForAI.push({ role: newUserMessage.role, content: newUserMessage.content }); // Add the current user message

      try {
        const aiResponseContent = await getLongCatCompletion(messagesForAI, {
          researchMode: 'none', // Default to 'none' for now, will be configurable later
          deepthinkMode: false, // Default to 'false' for now, will be configurable later
          userId: session.user.id, // Pass userId for country context
        });

        const newAIMessage: ChatMessage = {
          id: Date.now().toString() + '-ai', // Temporary ID for UI
          role: 'assistant',
          content: aiResponseContent,
          created_at: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, newAIMessage]);

        // Store AI message in Supabase
        const { data: aiMessageData, error: aiMessageError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            role: newAIMessage.role,
            content: newAIMessage.content,
          })
          .select('id, created_at')
          .single();

        if (aiMessageError) {
          console.error("Error saving AI message to Supabase:", aiMessageError);
          showError("Failed to save AI response.");
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newAIMessage.id));
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
        // Optionally, remove the user's message if AI response fails
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id));
      } finally {
        setLoadingAIResponse(false); // End AI loading
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
      <Card className="flex flex-col h-full max-h-[calc(100vh-150px)] items-center justify-center">
        <p className="text-muted-foreground">Loading chat history...</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full max-h-[calc(100vh-150px)]">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                <h3 className="text-xl font-semibold mb-2">Start a new conversation!</h3>
                <p>Ask JudgiAI a legal question to get started.</p>
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
          disabled={loadingAIResponse} // Disable input while AI is loading
        />
        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse}>
          {loadingAIResponse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;