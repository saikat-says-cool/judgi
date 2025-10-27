"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ResearchMode = 'none' | 'medium' | 'max';

interface ChatModeContextType {
  researchMode: ResearchMode;
  setResearchMode: (mode: ResearchMode) => void;
  deepthinkMode: boolean;
  setDeepthinkMode: (active: boolean) => void;
}

const ChatModeContext = createContext<ChatModeContextType | undefined>(undefined);

export const ChatModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [researchMode, setResearchMode] = useState<ResearchMode>('medium'); // Default to medium research
  const [deepthinkMode, setDeepthinkMode] = useState<boolean>(false);

  return (
    <ChatModeContext.Provider value={{ researchMode, setResearchMode, deepthinkMode, setDeepthinkMode }}>
      {children}
    </ChatModeContext.Provider>
  );
};

export const useChatModes = () => {
  const context = useContext(ChatModeContext);
  if (context === undefined) {
    throw new Error('useChatModes must be used within a ChatModeProvider');
  }
  return context;
};