"use client";

import React from 'react';
import { Card } from '@/components/ui/card'; // Added this import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Square, Mic } from 'lucide-react'; // Import Mic and Square
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VoiceRecorder from './VoiceRecorder'; // Import VoiceRecorder

interface NewChatWelcomeProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  loadingAIResponse: boolean;
  researchMode: 'no_research' | 'moderate_research' | 'deep_research';
  setResearchMode: (mode: 'no_research' | 'moderate_research' | 'deep_research') => void;
  aiModelMode: 'auto' | 'deep_think';
  setAiModelMode: (mode: 'auto' | 'deep_think') => void;
  isRecording: boolean;
  setIsRecording: (active: boolean) => void;
  onTranscriptionComplete: (text: string) => void;
  onRecordingCancel: () => void;
  isTranscribingAudio: boolean; // New prop for transcription loading
  handleStartRecording: () => void; // New prop to start recording
}

const NewChatWelcome: React.FC<NewChatWelcomeProps> = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  loadingAIResponse,
  researchMode,
  setResearchMode,
  aiModelMode,
  setAiModelMode,
  isRecording,
  setIsRecording,
  onTranscriptionComplete,
  onRecordingCancel,
  isTranscribingAudio,
  handleStartRecording,
}) => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !loadingAIResponse && !isTranscribingAudio) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4">
      <Card className="w-full max-w-lg p-6 text-center bg-card shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-foreground">What can I help with?</h3>
        <p className="text-muted-foreground mb-6">Ask JudgiAI a question to get started.</p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Select onValueChange={setResearchMode} value={researchMode} disabled={loadingAIResponse || isTranscribingAudio}>
            <SelectTrigger className="w-full md:w-[180px] h-9 text-sm" aria-label="Select research mode">
              <SelectValue placeholder="Research Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_research">No Research</SelectItem>
              <SelectItem value="moderate_research">Moderate Research</SelectItem>
              <SelectItem value="deep_research">Deep Research</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setAiModelMode} value={aiModelMode} disabled={loadingAIResponse || isTranscribingAudio}>
            <SelectTrigger className="w-full md:w-[180px] h-9 text-sm" aria-label="Select AI model">
              <SelectValue placeholder="AI Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="deep_think">Deep Think</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isRecording ? (
            <VoiceRecorder
              onTranscriptionComplete={onTranscriptionComplete}
              onRecordingCancel={onRecordingCancel}
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
                onKeyDown={handleKeyPress}
                disabled={loadingAIResponse}
                autoFocus
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
        </div>
      </Card>
    </div>
  );
};

export default NewChatWelcome;