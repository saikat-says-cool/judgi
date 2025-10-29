"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WritingCanvas from '@/components/WritingCanvas';
import CanvasAIAssistant from '@/components/CanvasAIAssistant';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X, Save, Loader2, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportAsDocx, exportAsPdf } from '@/utils/documentExport';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const CanvasEditorPage = () => {
  const { documentId } = useParams<{ documentId?: string }>();
  const navigate = useNavigate();
  const { supabase, session } = useSession();

  const [writingContent, setWritingContent] = useState<string>("");
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("Untitled Document");
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [aiWritingToCanvas, setAiWritingToCanvas] = useState(false); // New state for AI writing to canvas

  // Ref to store the latest content and chat history for beforeunload event
  const latestContentRef = useRef(writingContent);
  const latestChatHistoryRef = useRef(aiChatHistory);
  const latestDocumentTitleRef = useRef(documentTitle);
  const latestHasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    latestContentRef.current = writingContent;
    latestChatHistoryRef.current = aiChatHistory;
    latestDocumentTitleRef.current = documentTitle;
    latestHasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [writingContent, aiChatHistory, documentTitle, hasUnsavedChanges]);


  // Handle beforeunload event for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (latestHasUnsavedChangesRef.current) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
        return ''; // Required for Firefox
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  const createNewDocument = useCallback(async (initialTitle: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to create a new document.");
      return null;
    }
    const { data, error } = await supabase
      .from('documents')
      .insert({ user_id: session.user.id, title: initialTitle, content: '', chat_history: [] })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating new document:", error);
      showError("Failed to create a new canvas.");
      return null;
    }
    return data.id;
  }, [session?.user?.id, supabase]);

  const saveDocument = useCallback(async (docId: string, content: string, chatHistory: ChatMessage[], title: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to save a document.");
      return false;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('documents')
      .update({ content: content, chat_history: chatHistory, title: title, updated_at: new Date().toISOString() })
      .eq('id', docId)
      .eq('user_id', session.user.id);

    setIsSaving(false);
    if (error) {
      console.error("Error saving document:", error);
      showError("Failed to save document.");
      return false;
    }
    setHasUnsavedChanges(false);
    showSuccess("Document saved!");
    return true;
  }, [session?.user?.id, supabase]);

  // Effect to load document or create new one
  useEffect(() => {
    const loadDocument = async (id: string) => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, content, chat_history')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error("Error loading document:", error);
        showError("Failed to load document.");
        navigate('/app/canvas', { replace: true }); // Redirect to home if document not found or error
      } else if (data) {
        setDocumentTitle(data.title);
        setWritingContent(data.content);
        setAiChatHistory(data.chat_history as ChatMessage[]);
        setCurrentDocumentId(data.id);
        setHasUnsavedChanges(false);
      }
      setIsLoading(false);
    };

    if (documentId === 'new') {
      // Start with a blank canvas, will be saved on first content change or explicit save
      setDocumentTitle("Untitled Document");
      setWritingContent("");
      setAiChatHistory([]);
      setCurrentDocumentId(null); // No ID until saved
      setHasUnsavedChanges(false);
      setIsLoading(false);
    } else if (documentId && documentId !== currentDocumentId) {
      loadDocument(documentId);
    } else if (!documentId) {
      navigate('/app/canvas', { replace: true }); // Redirect if no documentId
    }
  }, [documentId, session?.user?.id, supabase, navigate, currentDocumentId]);

  // Auto-save logic (optional, but good for user experience)
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hasUnsavedChanges && currentDocumentId) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDocument(currentDocumentId, writingContent, aiChatHistory, documentTitle);
      }, 5000); // Auto-save every 5 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [writingContent, aiChatHistory, documentTitle, hasUnsavedChanges, currentDocumentId, saveDocument]);


  const handleContentChange = useCallback((content: string) => {
    setWritingContent(content);
    setHasUnsavedChanges(true);
    // If it's a new document and content is added, prompt for initial save/title
    if (!currentDocumentId && content.trim().length > 0) {
      // This will be handled by the explicit save button or auto-save
    }
  }, [currentDocumentId]);

  const handleAIChatHistoryChange = useCallback((history: ChatMessage[]) => {
    setAiChatHistory(history);
    setHasUnsavedChanges(true);
  }, []);

  const handleAIDocumentWrite = useCallback((contentToAppend: string) => {
    setAiWritingToCanvas(true); // Set AI writing state
    setWritingContent((prevContent) => {
      // Append content with a new line if existing content is not empty
      return prevContent.length > 0 ? `${prevContent}\n\n${contentToAppend}` : contentToAppend;
    });
    setHasUnsavedChanges(true);
    setAiWritingToCanvas(false); // Reset AI writing state after content is added
  }, []);

  const handleDocumentTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
    setHasUnsavedChanges(true);
  }, []);

  const handleCloseEditor = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      navigate('/app/canvas');
    }
  };

  const handleConfirmClose = async () => {
    if (currentDocumentId) {
      await saveDocument(currentDocumentId, writingContent, aiChatHistory, documentTitle);
    } else if (writingContent.trim() || aiChatHistory.length > 0) {
      // If it's a new document with content, force an initial save before closing
      const newDocId = await createNewDocument(documentTitle);
      if (newDocId) {
        await saveDocument(newDocId, writingContent, aiChatHistory, documentTitle);
      }
    }
    setShowUnsavedChangesDialog(false);
    navigate('/app/canvas');
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    navigate('/app/canvas');
  };

  const handleManualSave = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to save.");
      return;
    }

    if (!currentDocumentId) {
      // If it's a new document, create it first
      const newDocId = await createNewDocument(documentTitle);
      if (newDocId) {
        setCurrentDocumentId(newDocId);
        await saveDocument(newDocId, writingContent, aiChatHistory, documentTitle);
        navigate(`/app/canvas/${newDocId}`, { replace: true }); // Update URL
      }
    } else {
      await saveDocument(currentDocumentId, writingContent, aiChatHistory, documentTitle);
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportAsDocx(documentTitle, writingContent);
      showSuccess("Document exported as DOCX!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to export DOCX.");
    }
  };

  const handleExportPdf = () => {
    try {
      exportAsPdf(documentTitle, writingContent);
      showSuccess("Document exported as PDF!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to export PDF.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Floating Header for Title and Actions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-md border">
        <Input
          value={documentTitle}
          onChange={handleDocumentTitleChange}
          placeholder="Document Title"
          className="w-64 text-center text-lg font-semibold h-9"
          disabled={isSaving}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleManualSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={hasUnsavedChanges ? "text-primary" : "text-muted-foreground"}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <FileDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportDocx}>
              Download as DOCX
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf}>
              Download as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={handleCloseEditor}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 pt-16">
        <ResizablePanel defaultSize={60} minSize={30}>
          <WritingCanvas
            content={writingContent}
            onContentChange={handleContentChange}
            readOnly={aiWritingToCanvas} // Make canvas read-only when AI is writing
          />
          {aiWritingToCanvas && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>JudgiAI is writing...</span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CanvasAIAssistant
            writingContent={writingContent}
            onAIDocumentWrite={handleAIDocumentWrite} // New prop for AI to write to canvas
            aiChatHistory={aiChatHistory}
            onAIChatHistoryChange={handleAIChatHistoryChange}
            documentId={currentDocumentId}
            isAIWritingToCanvas={aiWritingToCanvas} // Pass AI writing state to assistant
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Save & Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CanvasEditorPage;