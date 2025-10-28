"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string; // Add created_at for sorting
}

const ChatPage = () => {
  const { supabase, session } = useSession();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
  }, [session?.user?.id, supabase]); // Re-fetch if user changes or supabase client changes

  const handleSendMessage = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to send messages.");
      return;
    }

    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID for UI
        role: 'user',
        content: inputMessage.trim(),
        created_at: new Date().toISOString(), // Add a temporary timestamp
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputMessage('');

      // Store message in Supabase
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: session.user.id,
          role: newMessage.role,
          content: newMessage.content,
        })
        .select('id, created_at') // Select actual ID and timestamp from DB
        .single();

      if (error) {
        console.error("Error saving message to Supabase:", error);
        showError("Failed to save message. Please try again.");
        // Revert the message from UI if saving fails
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newMessage.id));
      } else if (data) {
        // Update the temporary message with actual DB ID and timestamp
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newMessage.id ? { ...msg, id: data.id, created_at: data.created_at } : msg
          )
        );
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
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
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Start a new conversation!
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
        />
        <Button type="submit" size="icon" onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatPage;