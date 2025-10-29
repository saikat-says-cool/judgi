"use client";

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import remarkGfm from 'remark-gfm'; // Import remarkGfm for GitHub Flavored Markdown

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
  if (readOnly) {
    // When AI is writing, display content as formatted Markdown
    return (
      <div className="flex flex-col h-full p-4 overflow-auto">
        <div className="flex-1 text-lg leading-relaxed p-0 bg-background text-foreground prose prose-lg dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // Otherwise, display as an editable textarea
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