"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import NewChatWelcome from '@/components/NewChatWelcome';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isStreaming?: boolean; // New property to indicate if message is currently streaming
}

// Helper function to parse AI response for document tags
const parseAIResponse = (fullAIResponse: string) => {
  let chatResponse = fullAIResponse;
  let documentUpdate: { type: 'append' | 'replace'; content: string } | null = null;

  const documentReplaceRegex = /<DOCUMENT_REPLACE>(.*?)<\/DOCUMENT_REPLACE>/s;
  const replaceMatch = fullAIResponse.match(documentReplaceRegex);

  if (replaceMatch && replaceMatch[1]) {
    documentUpdate = { type: 'replace', content: replaceMatch[1].trim() };
    chatResponse = fullAIResponse.replace(documentReplaceRegex, '').trim();
  } else {
    const documentWriteRegex = /<DOCUMENT_WRITE>(.*?)<\/DOCUMENT_WRITE>/s;
    const writeMatch = fullAIResponse.match(documentWriteRegex);
    if (writeMatch && writeMatch[1]) {
      documentUpdate = { type: 'append', content: writeMatch[1].trim() };
      chatResponse = fullAIResponse.replace(documentWriteRegex, '').trim();
    }
  }
  return { chatResponse, documentUpdate };
};

const ChatPage = () => {
  const { supabase, session } = useSession();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null); // Ref to the last message for smooth scrolling

  // Auto-scroll to bottom smoothly
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); // This effect runs every time the 'messages' array changes.

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

      // Add user message to local state immediately
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(), // Temporary ID for immediate display
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInputMessage('');
      setLoadingAIResponse(true);

      // If it's a new chat, create the conversation and save the first message
      if (!activeConversationId) {
        const initialTitle = userMessageContent.substring(0, 50) + (userMessageContent.length > 50 ? '...' : '');
        activeConversationId = await createNewConversation(initialTitle);
        if (!activeConversationId) {
          setLoadingAIResponse(false);
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id)); // Remove user message if conversation creation fails
          return;
        }

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
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id)); // Remove user message if save fails
          return;
        }

        // Now navigate to the new conversation ID
        setCurrentConversationId(activeConversationId);
        navigate(`/app/chat/${activeConversationId}`, { replace: true });

        // Update the temporary user message with real ID
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newUserMessage.id ? { ...msg, id: userMessageData.id, created_at: userMessageData.created_at } : msg
          )
        );

      } else {
        // For existing chats, save user message
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

      // Prepare messages for AI, including the latest user message
      const messagesForAI = [...messages.filter(msg => !msg.isStreaming), { role: 'user', content: userMessageContent }];

      // Add a temporary AI message for streaming
      const streamingAIMessageId = Date.now().toString() + '-ai-streaming';
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: streamingAIMessageId, role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() },
      ]);

      let fullAIResponseContent = '';
      try {
        for await (const chunk of getLongCatCompletion(messagesForAI, {
          researchMode: 'none',
          deepthinkMode: false,
          userId: session.user.id,
        })) {
          // Stream character by character with a small delay
          for (const char of chunk) {
            fullAIResponseContent += char;
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === streamingAIMessageId ? { ...msg, content: fullAIResponseContent } : msg
              )
            );
            await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay per character
          }
        }

        // After streaming, parse the full response for chat and document parts
        const { chatResponse } = parseAIResponse(fullAIResponseContent);

        // Update the streaming message with final content and mark as not streaming
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === streamingAIMessageId ? { ...msg, content: chatResponse, isStreaming: false } : msg
          )
        );

        // Save final AI message to Supabase
        const { data: aiMessageData, error: aiMessageError } = await supabase
          .from('chats')
          .insert({
            user_id: session.user.id,
            conversation_id: activeConversationId,
            role: 'assistant',
            content: chatResponse,
          })
          .select('id, created_at')
          .single();

        if (aiMessageError) {
          console.error("Error saving AI message to Supabase:", aiMessageError);
          showError("Failed to save AI response.");
          // Optionally remove the message from local state if saving fails
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== streamingAIMessageId));
        } else if (aiMessageData) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === streamingAIMessageId ? { ...msg, id: aiMessageData.id, created_at: aiMessageData.created_at } : msg
            )
          );
        }

      } catch (error) {
        console.error("Error getting AI response:", error);
        showError("Failed to get AI response. Please check your API key and network connection.");
        // Remove the streaming message if an error occurs
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== streamingAIMessageId));
      } finally {
        setLoadingAIResponse(false);
      }
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
      {messages.length === 0 && conversationId === 'new' ? (
        <NewChatWelcome
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          loadingAIResponse={loadingAIResponse}
        />
      ) : (
        <>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4"> {/* Removed p-4 from here */}
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      ref={index === messages.length - 1 ? lastMessageRef : null}
                      className={`flex ${message.role === 'user' ? 'justify-end px-4' : 'justify-start w-full'}`} {/* Added px-4 for user, w-full for AI */}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground max-w-[70%]'
                            : 'bg-muted text-muted-foreground prose prose-sm dark:prose-invert w-full'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {loadingAIResponse && messages.some(msg => msg.isStreaming) && (
                    <div className="flex justify-start w-full"> {/* w-full for AI thinking container */}
                      <div className="p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2 w-full">
                        <Square className="h-4 w-4 animate-spin" />
                        <span>JudgiAI is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t flex items-center gap-2">
            <Input
              placeholder="Ask Judgi"
              className="flex-1"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loadingAIResponse) {
                  handleSendMessage();
                }
              }}
              disabled={loadingAIResponse}
            />
            <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse}>
              {loadingAIResponse ? <Square className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default ChatPage;