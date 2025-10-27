"use client";

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { useChatModes } from '@/contexts/ChatModeContext';
import { Brain, Search, SearchCode, SearchX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ChatModes: React.FC = () => {
  const { researchMode, setResearchMode, deepthinkMode, setDeepthinkMode } = useChatModes();

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-t border-b border-border bg-card">
      <span className="text-sm font-medium text-muted-foreground mr-2">Modes:</span>
      
      <ToggleGroup
        type="single"
        value={researchMode}
        onValueChange={(value: ResearchMode) => value && setResearchMode(value)}
        className="flex-grow justify-start"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="none" aria-label="No Legal Research">
              <SearchX className="h-4 w-4 mr-2" /> No Research
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            No specific legal documents pulled, only current relevant news.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="medium" aria-label="Medium Legal Research">
              <Search className="h-4 w-4 mr-2" /> Medium Research
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            Medium number of legal documents pulled from Langsearch.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="max" aria-label="Max Legal Research">
              <SearchCode className="h-4 w-4 mr-2" /> Max Research
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            Heavy number of legal documents pulled from Langsearch.
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>

      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={deepthinkMode}
            onPressedChange={setDeepthinkMode}
            aria-label="Deepthink Mode"
            className="ml-auto" // Pushes deepthink to the right
          >
            <Brain className="h-4 w-4 mr-2" /> Deepthink
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>
          Uses Longcat-Flash-Thinking model for more in-depth analysis.
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default ChatModes;