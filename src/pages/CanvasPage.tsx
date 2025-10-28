"use client";

import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WritingCanvas from '@/components/WritingCanvas';
import CanvasAIAssistant from '@/components/CanvasAIAssistant';

const CanvasPage = () => {
  const [writingContent, setWritingContent] = useState<string>("");

  const handleInsertContent = (contentToInsert: string) => {
    setWritingContent((prevContent) => {
      // Add a newline for better formatting if content already exists
      return prevContent.length > 0 ? `${prevContent}\n\n${contentToInsert}` : contentToInsert;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={60} minSize={30}>
          <WritingCanvas
            content={writingContent}
            onContentChange={setWritingContent}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CanvasAIAssistant
            writingContent={writingContent}
            onInsertContent={handleInsertContent} // Pass the new callback
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CanvasPage;