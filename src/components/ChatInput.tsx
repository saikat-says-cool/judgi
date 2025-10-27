"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string; // Added placeholder prop
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, placeholder = "Type your message here..." }) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Textarea
        placeholder={placeholder} // Use the placeholder prop
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-grow resize-none min-h-[40px]"
      />
      <Button onClick={handleSend} disabled={!input.trim()} className="flex items-center gap-1"> {/* Added flex and gap for icon and text */}
        <Send className="h-4 w-4" />
        <span>Send</span> {/* Added Send text */}
      </Button>
    </div>
  );
};

export default ChatInput;