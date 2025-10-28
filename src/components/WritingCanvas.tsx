"use client";

import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface WritingCanvasProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const WritingCanvas: React.FC<WritingCanvasProps> = ({
  content,
  onContentChange,
  placeholder = "Start writing your legal document here...",
  readOnly = false,
}) => {
  return (
    <div className="flex flex-col h-full p-4">
      <Textarea
        className="flex-1 resize-none border-none focus-visible:ring-0 text-lg leading-relaxed p-0 bg-background text-foreground"
        placeholder={placeholder}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
};

export default WritingCanvas;