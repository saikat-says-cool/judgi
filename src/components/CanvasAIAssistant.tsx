"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square, Sparkles } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseAIResponse } from '@/utils/aiResponseParser'; // Import from new utility file

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
  aiDocumentAction: 'append' | 'replace' | null;
}

type ResearchMode = 'no_research' | 'moderate_research' | 'deep_research'; // Renamed 'quick_lookup' to 'no_research'
type AiModelMode = 'auto' | 'deep_think';

const fonts = [
  { name: 'Inter', style: 'font-inter' },
  { name: 'Comfortaa', style: 'font-comfortaa' },
  { name: 'Arial', style: 'font-arial' },
  { name: 'Times New Roman', style: 'font-times' },
  { name: 'Courier New', style: 'font-courier' },
  { name: 'Georgia', style: 'font-georgia' },
  { name: 'Verdana', style: 'font-verdana' },
];

const CanvasAIAssistant: React.FC<CanvasAIAssistantProps> = ({
  writingContent,
  onAIDocumentUpdate,
  aiChatHistory,
  onAIChatHistoryChange,
  documentId,
  isAIWritingToCanvas,
  aiOutputFontFamily,
  setAiOutputFontFamily,
  aiDocumentAction,
}) => {
  const { session } = useSession();
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [researchMode, setResearchMode] = useState<ResearchMode>('no_research'); // Default to 'no_research'
  const [aiModelMode, setAiModelMode] = useState<AiModelMode>('auto'); // New state for AI model mode
  const [detailedLoadingMessage, setDetailedLoadingMessage] = useState<string | null>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current && scrollAreaRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [aiChatHistory]);

  const sendAIRequest = async (messageContent: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to send messages.");
      return;
    }
    if (loadingAIResponse || isAIWritingToCanvas) {
      showError("Please wait for the current AI operation to complete.");
      return;
    }

    const userMessageContent = messageContent.trim();
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
    setIsAITyping(false);
    setDetailedLoadingMessage(null);

    const streamingAIMessageId = Date.now().toString() + '-ai-streaming';
    onAIChatHistoryChange((prevHistory) => [
      ...prevHistory.filter(msg => msg.id !== streamingAIMessageId),
      { id: streamingAIMessageId, role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() },
    ]);

    let fullAIResponseContent = '';
    let lastChatResponseLength = 0;
    try {
      for await (const chunk of getLongCatCompletion(updatedChatHistory.map(msg => ({ role: msg.role, content: msg.content })), {
        researchMode: researchMode,
        aiModelMode: aiModelMode, // Pass new AI model mode
        userId: session.user.id,
        currentDocumentContent: writingContent,
        onStatusUpdate: setDetailedLoadingMessage,
      })) {
        if (chunk) {
          fullAIResponseContent += chunk;
          
          const { chatResponse: currentChatResponse } = parseAIResponse(fullAIResponseContent);

          if (currentChatResponse.length > lastChatResponseLength) {
            setIsAITyping(true);
          }
          lastChatResponseLength = currentChatResponse.length;

          onAIChatHistoryChange((prevHistory) =>
            prevHistory.map((msg) =>
              msg.id === streamingAIMessageId ? { ...msg, content: currentChatResponse } : msg
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
      setIsAITyping(false);
      setDetailedLoadingMessage(null);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      sendAIRequest(inputMessage);
    }
  };

  const handleDraftingAction = (action: string) => {
    let prompt = '';
    switch (action) {
      case 'summarize':
        prompt = 'Please summarize the current document content concisely.';
        break;
      case 'petition':
        prompt = 'Please reformat the current document content into a draft legal petition structure.';
        break;
      case 'improve_language':
        prompt = 'Please improve the legal language and clarity of the current document content.';
        break;
      case 'expand_section':
        prompt = 'Please expand on the last section of the current document, adding more detail and relevant legal points.';
        break;
      case 'suggest_argument':
        prompt = 'Based on the current document content, suggest the next logical argument or section to add.';
        break;
      case 'suggest_precedents':
        prompt = 'Based on the current document content, suggest relevant legal precedents and their citations. Provide them as Markdown links.';
        break;
      case 'generate_footnotes':
        prompt = 'Review the current document content and generate appropriate footnotes or citations for any legal statements or references. Insert them directly into the document using the appropriate document tags.';
        break;
      default:
        return;
    }
    sendAIRequest(prompt);
  };

  const getChatLoadingMessage = () => {
    if (detailedLoadingMessage) {
      return detailedLoadingMessage;
    }
    if (aiDocumentAction === 'append') {
      return "JudgiAI is appending to document...";
    } else if (aiDocumentAction === 'replace') {
      return "JudgiAI is replacing document content...";
    }
    return "JudgiAI is thinking...";
  };

  return (
    <Card className="flex flex-col h-full border-none shadow-none">
      <CardHeader className="border-b p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg mb-2 sm:mb-0">AI Assistant</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-sm" aria-label="Drafting actions">
                <Sparkles className="h-4 w-4 mr-2" /> Drafting Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDraftingAction('summarize')}>
                Summarize Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('petition')}>
                Draft as Petition
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('improve_language')}>
                Improve Legal Language
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('expand_section')}>
                Expand Last Section
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('suggest_argument')}>
                Suggest Next Argument
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('suggest_precedents')}>
                Suggest Precedents for Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDraftingAction('generate_footnotes')}>
                Generate Footnotes/Citations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select onValueChange={(value: ResearchMode) => setResearchMode(value)} value={researchMode}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm" aria-label="Select research mode">
              <SelectValue placeholder="Research Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_research">No Research</SelectItem> {/* Renamed */}
              <SelectItem value="moderate_research">Moderate Research</SelectItem>
              <SelectItem value="deep_research">Deep Research</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value: AiModelMode) => setAiModelMode(value)} value={aiModelMode}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm" aria-label="Select AI model">
              <SelectValue placeholder="AI Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="deep_think">Deep Think</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setAiOutputFontFamily} value={aiOutputFontFamily}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm" aria-label="Select AI output font">
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4" viewportRef={scrollAreaRef}>
            <div className="space-y-4">
              {aiChatHistory.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
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
                    className={`p-3 rounded-lg text-sm ${
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
              {loadingAIResponse && !isAITyping && (
                <div className="flex justify-start w-full">
                  <div className="p-3 rounded-lg bg-muted text-muted-foreground flex items-center gap-2 text-sm w-full">
                    <Square className="h-4 w-4 animate-spin" />
                    <span>{getChatLoadingMessage()}</span>
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
        <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse || isAIWritingToCanvas} aria-label="Send message to AI assistant">
          {loadingAIResponse || isAIWritingToCanvas ? <Square className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasAIAssistant;