"use client";

import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import ChatModes from './ChatModes'; // Import ChatModes

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, placeholder = "Type your message..." }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <ChatModes /> {/* Render ChatModes here, above the input */}
      <div className="flex items-center gap-2">
        <Textarea
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="min-h-[40px] resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;