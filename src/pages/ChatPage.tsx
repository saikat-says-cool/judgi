"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square, Save, Mic } from 'lucide-react'; // Import Mic icon
import { useSession } from '@/contexts/SessionContext'; // Corrected import path
import { showError } from '@/utils/toast';
import { getLongCatCompletion } from '@/services/longcatApi';
import NewChatWelcome from '@/components/NewChatWelcome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SaveToCanvasDialog from '@/components/SaveToCanvasDialog';
import { parseAIResponse } from '@/utils/aiResponseParser'; // Import from new utility file
import VoiceRecorder from '@/components/VoiceRecorder'; // Import VoiceRecorder

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  isStreaming?: boolean;
}

type ResearchMode = 'no_research' | 'moderate_research' | 'deep_research';
type AiModelMode = 'auto' | 'deep_think';

const ChatPage = () => {
  const { supabase, session } = useSession();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true); // Always start as true, will be set to false by effects
  const [loadingAIResponse, setLoadingAIResponse] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [researchMode, setResearchMode] = useState<ResearchMode>('no_research');
  const [aiModelMode, setAiModelMode] = useState<AiModelMode>('auto'); // New state for AI model mode
  const [isSaveToCanvasDialogOpen, setIsSaveToCanvasDialogOpen] = useState(false);
  const [contentToSaveToCanvas, setContentToSaveToCanvas] = useState('');
  const [detailedLoadingMessage, setDetailedLoadingMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false); // New state for voice recording
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false); // New state for transcription loading

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom of the chat
  useEffect(() => {
    if (lastMessageRef.current && scrollAreaRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      if (scrollHeight - scrollTop - clientHeight < 100) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Effect to fetch chat history when conversationId from URL changes
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

    if (conversationId === 'new') {
      setMessages([]);
      setLoadingHistory(false); // No history to load for a new chat
    } else if (conversationId) {
      fetchChatHistory(conversationId);
    } else {
      navigate('/app/chat/new', { replace: true });
    }
  }, [conversationId, session?.user?.id, supabase, navigate]);

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
    if (loadingAIResponse || isTranscribingAudio) { // Disable if transcribing
      showError("Please wait for the current AI operation to complete.");
      return;
    }

    if (inputMessage.trim()) {
      const userMessageContent = inputMessage.trim();
      let activeConversationId = conversationId; // Use conversationId from URL directly

      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessageContent,
        created_at: new Date().toISOString(),
      };
      
      // Optimistically add user message to UI
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      setInputMessage('');
      setLoadingAIResponse(true);
      setIsAITyping(false);
      setDetailedLoadingMessage(null);

      let shouldNavigateAfterAI = false;

      if (activeConversationId === 'new') {
        const initialTitle = userMessageContent.substring(0, 50) + (userMessageContent.length > 50 ? '...' : '');
        const newConvId = await createNewConversation(initialTitle);
        if (!newConvId) {
          setLoadingAIResponse(false);
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id)); // Remove optimistic message
          return;
        }
        activeConversationId = newConvId;
        shouldNavigateAfterAI = true;
      }

      // Save user message to DB
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
        console.error("Error saving user message to Supabase:", userMessageError);
        showError("Failed to save your message. Please try again.");
        setLoadingAIResponse(false);
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id));
        return;
      } else if (userMessageData) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === newUserMessage.id ? { ...msg, id: userMessageData.id, created_at: userMessageData.created_at } : msg
          )
        );
      }

      // Construct messages for AI:
      // If it's a new conversation, only send the current user message.
      // If it's an existing conversation, send the full current messages array.
      const messagesForAI: LongCatMessage[] = [];
      if (activeConversationId !== 'new') { // If it's an existing conversation
        messagesForAI.push(...messages.filter(msg => !msg.isStreaming));
      }
      messagesForAI.push({ role: 'user', content: userMessageContent });


      const streamingAIMessageId = Date.now().toString() + '-ai-streaming';
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: streamingAIMessageId, role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() },
      ]);

      let fullAIResponseContent = '';
      let lastChatResponseLength = 0;
      try {
        for await (const chunk of getLongCatCompletion(messagesForAI, {
          researchMode: researchMode,
          aiModelMode: aiModelMode,
          userId: session.user.id,
          onStatusUpdate: setDetailedLoadingMessage,
        })) {
          if (chunk) {
            fullAIResponseContent += chunk;
            
            const { chatResponse: currentChatResponse } = parseAIResponse(fullAIResponseContent);

            if (currentChatResponse.length > lastChatResponseLength) {
              setIsAITyping(true);
            }
            lastChatResponseLength = currentChatResponse.length;

            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === streamingAIMessageId ? { ...msg, content: currentChatResponse } : msg
              )
            );
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }

        const { chatResponse } = parseAIResponse(fullAIResponseContent);

        // Update local state with final AI response
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === streamingAIMessageId ? { ...msg, content: chatResponse, isStreaming: false } : msg
          )
        );

        // Save AI message to DB
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
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== streamingAIMessageId));
        } else if (aiMessageData) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === streamingAIMessageId ? { ...msg, id: aiMessageData.id, created_at: aiMessageData.created_at } : msg
            )
          );
        }

        // Navigate ONLY after AI response is fully processed and saved, if it was a new chat
        if (shouldNavigateAfterAI && activeConversationId) {
          navigate(`/app/chat/${activeConversationId}`, { replace: true });
        }

      } catch (error) {
        console.error("Error getting AI response:", error);
        showError("Failed to get AI response. Please check your API key and network connection.");
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== streamingAIMessageId));
      } finally {
        setLoadingAIResponse(false);
        setIsAITyping(false);
        setDetailedLoadingMessage(null);
      }
    }
  };

  const handleOpenSaveToCanvasDialog = (content: string) => {
    setContentToSaveToCanvas(content);
    setIsSaveToCanvasDialogOpen(true);
  };

  const handleTranscriptionComplete = (text: string) => {
    setInputMessage(text);
    setIsRecording(false);
    setIsTranscribingAudio(false); // Transcription complete
  };

  const handleRecordingCancel = () => {
    setIsRecording(false);
    setIsTranscribingAudio(false); // Transcription cancelled
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsTranscribingAudio(true); // Start transcribing state immediately
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
          researchMode={researchMode}
          setResearchMode={setResearchMode}
          aiModelMode={aiModelMode}
          setAiModelMode={setAiModelMode}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onTranscriptionComplete={handleTranscriptionComplete}
          onRecordingCancel={handleRecordingCancel}
          isTranscribingAudio={isTranscribingAudio} // Pass to NewChatWelcome
          handleStartRecording={handleStartRecording} // Pass to NewChatWelcome
        />
      ) : (
        <>
          <CardHeader className="border-b p-4 flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">Chat</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select onValueChange={(value: ResearchMode) => setResearchMode(value)} value={researchMode} disabled={loadingAIResponse || isTranscribingAudio}>
                <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Research Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_research">No Research</SelectItem>
                  <SelectItem value="moderate_research">Moderate Research</SelectItem>
                  <SelectItem value="deep_research">Deep Research</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={(value: AiModelMode) => setAiModelMode(value)} value={aiModelMode} disabled={loadingAIResponse || isTranscribingAudio}>
                <SelectTrigger className="w-full md:w-[180px] h-9 text-sm">
                  <SelectValue placeholder="AI Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="deep_think">Deep Think</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4" viewportRef={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      ref={index === messages.length - 1 ? lastMessageRef : null}
                      className={`flex ${message.role === 'user' ? 'justify-end px-4' : 'justify-start w-full'}`}
                    >
                      <div
                        className={`p-3 rounded-lg text-sm ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground max-w-[70%]'
                            : 'bg-muted text-muted-foreground prose prose-sm dark:prose-invert w-full flex flex-col'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                            {!message.isStreaming && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 self-end text-xs h-7 px-2 py-1"
                                onClick={() => handleOpenSaveToCanvasDialog(message.content)}
                              >
                                <Save className="h-3 w-3 mr-1" /> Save to Canvas
                              </Button>
                            )}
                          </>
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
                        <span>{detailedLoadingMessage || "JudgiAI is thinking..."}</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t flex items-center gap-2">
            {isRecording ? (
              <VoiceRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onRecordingCancel={handleRecordingCancel}
                isRecordingActive={isRecording}
                setIsRecordingActive={setIsRecording}
              />
            ) : isTranscribingAudio ? (
              <div className="flex items-center justify-center w-full h-full px-2 py-2">
                <Square className="h-5 w-5 animate-spin mr-2 text-primary" />
                <span className="text-muted-foreground text-sm">Transcribing audio...</span>
              </div>
            ) : (
              <>
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
                {inputMessage.trim() === '' && ( // Show mic button only if input is empty
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleStartRecording}
                    disabled={loadingAIResponse}
                    aria-label="Start voice recording"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse} aria-label="Send message">
                  {loadingAIResponse ? <Square className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </>
            )}
          </CardFooter>
        </>
      )}
      <SaveToCanvasDialog
        isOpen={isSaveToCanvasDialogOpen}
        onClose={() => setIsSaveToCanvasDialogOpen(false)}
        contentToSave={contentToSaveToCanvas}
      />
    </Card>
  );
};

export default ChatPage;