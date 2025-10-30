"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isStreaming?: boolean;
}

interface CanvasAIAssistantProps {
  writingContent: string;
  onAIDocumentUpdate: (update: { type: 'append' | 'replace'; content: string }) => void;
  aiChatHistory: ChatMessage[];
  onAIChatHistoryChange: (history: ChatMessage[]) => void;
  documentId: string | null;
  isAIWritingToCanvas: boolean;
  aiOutputFontFamily: string;
  setAiOutputFontFamily: (font: string) => void;
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
          for (const char of chunk) {
            fullAIResponseContent += char;
            onAIChatHistoryChange((prevHistory) =>
              prevHistory.map((msg) =>
                msg.id === streamingAIMessageId ? { ...msg, content: fullAIResponseContent } : msg
              )
            );
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        const { chatResponse, documentUpdate } = parseAIResponse(fullAIResponseContent);

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
                <div className="text-center text-muted-foreground py-8 text-sm"> {/* Added text-sm here */}
                  <p>Your AI writing partner is ready!</p>
                  <p>Ask questions or get suggestions based on your document.</p>
                </div>
              )}
              {aiChatHistory.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === aiChatHistory.length - 1 ? lastMessageRef : null}
                  className={`flex ${message.role === 'user' ? 'justify-end px-4' : 'justify-start w-full'}`}
                >
                  <div
                    className={`p-3 rounded-lg text-sm ${ // Added text-sm here
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground max-w-[80%]'
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
              {loadingAIResponse && aiChatHistory.some(msg => msg.isStreaming) && (
                <div className="flex justify-start w-full">
                  <div className="p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2 text-sm w-full"> {/* Added text-sm here */}
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
            if (e.key === 'Enter' && !loadingAIResponse && !isAIWritingToCanvas) {
              handleSendMessage();
            }
          }}
          disabled={loadingAIResponse || isAIWritingToCanvas}
        />
        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse || isAIWritingToCanvas}>
          {loadingAIResponse || isAIWritingToCanvas ? <Square className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasAIAssistant;