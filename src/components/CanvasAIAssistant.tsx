"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface CanvasAIAssistantProps {
  writingContent: string;
  onAIDocumentUpdate: (update: { type: 'append' | 'replace'; content: string }) => void;
  aiChatHistory: ChatMessage[];
  onAIChatHistoryChange: (history: ChatMessage[]) => void;
  documentId: string | null;
  isAIWritingToCanvas: boolean;
}

const CanvasAIAssistant: React.FC<CanvasAIAssistantProps> = ({
  writingContent,
  onAIDocumentUpdate,
  aiChatHistory,
  onAIChatHistoryChange,
  documentId,
  isAIWritingToCanvas,
}) => {
  const { session } = useSession();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatHistory]);

  const handleSendMessage = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to send messages.");
      return;
    }
    if (loadingAIResponse || isAIWritingToCanvas) {
      showError("Please wait for the current AI operation to complete.");
      return;
    }

    if (inputMessage.trim()) {
      const userMessageContent = inputMessage.trim();
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
      };

      const updatedChatHistory = [...aiChatHistory, newUserMessage];
      onAIChatHistoryChange(updatedChatHistory);
      setInputMessage('');
      setLoadingAIResponse(true);

      try {
        const messagesForAI = updatedChatHistory.map(msg => ({ role: msg.role, content: msg.content }));

        const { chatResponse, documentUpdate } = await getLongCatCompletion(messagesForAI, {
          researchMode: 'none',
          deepthinkMode: false,
          userId: session.user.id,
          currentDocumentContent: writingContent,
        });

        if (chatResponse) {
          const newAIMessage: ChatMessage = {
            id: Date.now().toString() + '-ai',
            role: 'assistant',
            content: chatResponse,
            created_at: new Date().toISOString(),
          };
          onAIChatHistoryChange([...updatedChatHistory, newAIMessage]);
        } else {
          onAIChatHistoryChange(updatedChatHistory);
        }

        if (documentUpdate) {
          onAIDocumentUpdate(documentUpdate);
        }

      } catch (error) {
        console.error("Error getting AI response:", error);
        showError("Failed to get AI response. Please check your API key and network connection.");
        onAIChatHistoryChange(aiChatHistory);
      } finally {
        setLoadingAIResponse(false);
      }
    }
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-lg">AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {aiChatHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>Your AI writing partner is ready!</p>
                  <p>Ask questions or get suggestions based on your document.</p>
                </div>
              )}
              {aiChatHistory.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === aiChatHistory.length - 1 ? lastMessageRef : null}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground prose prose-sm dark:prose-invert' // Added prose classes
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
              {loadingAIResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
          placeholder="Ask your AI assistant..."
          className="flex-1"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loadingAIResponse && !isAIWritingToCanvas) {
              handleSendMessage();
            }
          }}
          disabled={loadingAIResponse || isAIWritingToCanvas}
        />
        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse || isAIWritingToCanvas}>
          {loadingAIResponse || isAIWritingToCanvas ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasAIAssistant;