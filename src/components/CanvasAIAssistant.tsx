"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added this import
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square } from 'lucide-react'; // Import Square
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isStreaming?: boolean; // New property to indicate if message is currently streaming
}

interface CanvasAIAssistantProps {
  writingContent: string;
  onAIDocumentUpdate: (update: { type: 'append' | 'replace'; content: string }) => void;
  aiChatHistory: ChatMessage[];
  onAIChatHistoryChange: (history: ChatMessage[]) => void;
  documentId: string | null;
  isAIWritingToCanvas: boolean;
  aiOutputFontFamily: string; // New prop for AI output font
  setAiOutputFontFamily: (font: string) => void; // New prop for setting AI output font
}

const fonts = [
  { name: 'Inter', style: 'font-inter' },
  { name: 'Comfortaa', style: 'font-comfortaa' },
  { name: 'Arial', style: 'font-arial' },
  { name: 'Times New Roman', style: 'font-times' },
  { name: 'Courier New', style: 'font-courier' },
  { name: 'Georgia', style: 'font-georgia' },
  { name: 'Verdana', style: 'font-verdana' },
];

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

const CanvasAIAssistant: React.FC<CanvasAIAssistantProps> = ({
  writingContent,
  onAIDocumentUpdate,
  aiChatHistory,
  onAIChatHistoryChange,
  documentId,
  isAIWritingToCanvas,
  aiOutputFontFamily,
  setAiOutputFontFamily,
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

      const updatedChatHistory = [...aiChatHistory.filter(msg => !msg.isStreaming), newUserMessage];
      onAIChatHistoryChange(updatedChatHistory);
      setInputMessage('');
      setLoadingAIResponse(true);

      // Add a temporary AI message for streaming
      const streamingAIMessageId = Date.now().toString() + '-ai-streaming';
      onAIChatHistoryChange([
        ...updatedChatHistory,
        { id: streamingAIMessageId, role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() },
      ]);

      let fullAIResponseContent = '';
      try {
        for await (const chunk of getLongCatCompletion(updatedChatHistory.map(msg => ({ role: msg.role, content: msg.content })), {
          researchMode: 'none',
          deepthinkMode: false,
          userId: session.user.id,
          currentDocumentContent: writingContent,
        })) {
          // Stream character by character with a small delay
          for (const char of chunk) {
            fullAIResponseContent += char;
            onAIChatHistoryChange((prevHistory) =>
              prevHistory.map((msg) =>
                msg.id === streamingAIMessageId ? { ...msg, content: fullAIResponseContent } : msg
              )
            );
            await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay per character
          }
        }

        // After streaming, parse the full response for chat and document parts
        const { chatResponse, documentUpdate } = parseAIResponse(fullAIResponseContent);

        // Update the streaming message with final content and mark as not streaming
        onAIChatHistoryChange((prevHistory) =>
          prevHistory.map((msg) =>
            msg.id === streamingAIMessageId ? { ...msg, content: chatResponse, isStreaming: false } : msg
          )
        );

        if (documentUpdate) {
          onAIDocumentUpdate(documentUpdate);
        }

      } catch (error) {
        console.error("Error getting AI response:", error);
        showError("Failed to get AI response. Please check your API key and network connection.");
        // Remove the streaming message if an error occurs
        onAIChatHistoryChange((prevHistory) => prevHistory.filter(msg => msg.id !== streamingAIMessageId));
      } finally {
        setLoadingAIResponse(false);
      }
    }
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none">
      <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">AI Assistant</CardTitle>
        <Select onValueChange={setAiOutputFontFamily} value={aiOutputFontFamily}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="AI Output Font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.name} value={font.name} className={font.style}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                        : 'bg-muted text-muted-foreground prose prose-sm dark:prose-invert'
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
              {loadingAIResponse && aiChatHistory.some(msg => msg.isStreaming) && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2">
                    <Square className="h-4 w-4 animate-spin" /> {/* Changed to Square */}
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
          placeholder="Ask Judgi" {/* Changed placeholder */}
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
          {loadingAIResponse || isAIWritingToCanvas ? <Square className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {/* Changed to Square */}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasAIAssistant;