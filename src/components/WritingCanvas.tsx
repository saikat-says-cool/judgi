"use client";

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (readOnly) {
      setIsEditing(false);
    }
  }, [readOnly]);

  const handleEditClick = () => {
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  if (isEditing && !readOnly) {
    return (
      <div className="flex flex-col h-full p-4 bg-white text-black"> {/* Changed background and text color */}
        <Textarea
          className="flex-1 resize-none border-none focus-visible:ring-0 text-lg leading-relaxed p-0 bg-white text-black" {/* Changed background and text color */}
          placeholder={placeholder}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={handleBlur}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-auto bg-white text-black"> {/* Changed background and text color */}
      <div
        className="flex-1 text-lg leading-relaxed p-0 bg-white text-black prose prose-lg" // Removed dark:prose-invert as background is white
        onClick={handleEditClick}
      >
        {content.trim() === "" && !readOnly ? (
          <span className="text-gray-500">{placeholder}</span> {/* Adjusted placeholder color for white background */}
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