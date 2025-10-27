"use client";

import React from 'react';
import { Toggle } from "@/components/ui/toggle"; // Assuming Toggle is used for DeepThink
import { useChatModes } from "@/contexts/ChatModeContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ChatModes = () => {
  const { deepthinkMode, setDeepthinkMode } = useChatModes();

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-t border-b border-border bg-card">
      {/* Research mode buttons removed as requested */}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              pressed={deepthinkMode}
              onPressedChange={setDeepthinkMode}
              aria-label="Toggle DeepThink mode"
              className="ml-auto"
            >
              DeepThink
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            Enables deeper, more analytical thinking for complex queries.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ChatModes;