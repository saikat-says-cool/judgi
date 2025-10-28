"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface NewChatWelcomeProps {
  inputMessage: string;
  setInputMessage: (message: string) => void;
  handleSendMessage: () => void;
  loadingAIResponse: boolean;
}

const NewChatWelcome: React.FC<NewChatWelcomeProps> = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  loadingAIResponse,
}) => {
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !loadingAIResponse) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4">
      <Card className="w-full max-w-lg p-6 text-center bg-card shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 text-foreground">What can I help with?</h3>
        <p className="text-muted-foreground mb-6">Ask JudgiAI a question to get started.</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            className="flex-1"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loadingAIResponse}
            autoFocus
          />
          <Button type="submit" size="icon" onClick={handleSendMessage} disabled={loadingAIResponse}>
            {loadingAIResponse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NewChatWelcome;