"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

interface WritingCanvasProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean; // This prop now means "AI is actively writing, so don't allow user edits"
}

const WritingCanvas: React.FC<WritingCanvasProps> = ({
  content,
  onContentChange,
  placeholder = "Start writing your legal document here...",
  readOnly = false, // This is true when AI is writing
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // If AI is writing, force read-only view and disable user editing
  useEffect(() => {
    if (readOnly) {
      setIsEditing(false); // Ensure we are in view mode when AI is writing
    }
  }, [readOnly]);

  const handleEditClick = () => {
    if (!readOnly) { // Only allow editing if AI is not actively writing
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  if (isEditing && !readOnly) { // User is editing and AI is not writing
    return (
      <div className="flex flex-col h-full p-4">
        <Textarea
          className="flex-1 resize-none border-none focus-visible:ring-0 text-lg leading-relaxed p-0 bg-background text-foreground"
          placeholder={placeholder}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={handleBlur}
          autoFocus // Automatically focus when switching to edit mode
        />
      </div>
    );
  }

  // Default view or when AI is writing (readOnly is true)
  return (
    <div className="flex flex-col h-full p-4 overflow-auto">
      <div
        className="flex-1 text-lg leading-relaxed p-0 bg-background text-foreground prose prose-lg dark:prose-invert cursor-text"
        onClick={handleEditClick} // Click to switch to edit mode
      >
        {content.trim() === "" && !readOnly ? ( // Show placeholder only if empty and not readOnly
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default WritingCanvas;