"use client";

import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WritingCanvas from '@/components/WritingCanvas';
import CanvasAIAssistant from '@/components/CanvasAIAssistant';

const CanvasPage = () => {
  const [writingContent, setWritingContent] = useState<string>("");

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
          <CanvasAIAssistant writingContent={writingContent} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default CanvasPage;