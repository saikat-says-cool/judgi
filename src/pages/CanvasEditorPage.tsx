"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RichTextEditor from '@/components/RichTextEditor';
import CanvasAIAssistant from '@/components/CanvasAIAssistant';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X, Save, Square, FileDown } from 'lucide-react';
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
import { markdownToHtml, htmlToMarkdownConverter } from '@/lib/markdownConverter';

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
  const [isLoading, setIsLoading] = useState(documentId !== 'new'); // Initialize based on documentId
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [aiWritingToCanvas, setAiWritingToCanvas] = useState(false);
  const [aiDocumentAction, setAiDocumentAction] = useState<'append' | 'replace' | null>(null);
  const [aiOutputFontFamily, setAiOutputFontFamily] = useState('Inter');

  const [initialWritingContent, setInitialWritingContent] = useState<string>("");
  const [initialAiChatHistory, setInitialAiChatHistory] = useState<ChatMessage[]>([]);
  const [initialDocumentTitle, setInitialDocumentTitle] = useState<string>("Untitled Document");

  const hasUnsavedChanges =
    writingContent !== initialWritingContent ||
    JSON.stringify(aiChatHistory) !== JSON.stringify(initialAiChatHistory) ||
    documentTitle !== initialDocumentTitle;

  const latestContentRef = useRef(writingContent);
  const latestChatHistoryRef = useRef(aiChatHistory);
  const latestDocumentTitleRef = useRef(documentTitle);
  const latestHasUnsavedChangesRef = useRef(hasUnsavedChanges);
  const lastFetchedDocumentIdRef = useRef<string | null>(null); // Ref to track last fetched ID

  useEffect(() => {
    latestContentRef.current = writingContent;
    latestChatHistoryRef.current = aiChatHistory;
    latestDocumentTitleRef.current = documentTitle;
    latestHasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [writingContent, aiChatHistory, documentTitle, hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (latestHasUnsavedChangesRef.current) {
        event.preventDefault();
        event.returnValue = '';
        return '';
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
    setInitialWritingContent(content);
    setInitialAiChatHistory(chatHistory);
    setInitialDocumentTitle(title);
    showSuccess("Document saved!");
    return true;
  }, [session?.user?.id, supabase]);

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
        navigate('/app/canvas', { replace: true });
      } else if (data) {
        setDocumentTitle(data.title);
        setWritingContent(data.content);
        setAiChatHistory(data.chat_history as ChatMessage[]);
        lastFetchedDocumentIdRef.current = data.id; // Update ref
        
        setInitialDocumentTitle(data.title);
        setInitialWritingContent(data.content);
        setInitialAiChatHistory(data.chat_history as ChatMessage[]);
      }
      setIsLoading(false);
    };

    if (documentId === 'new') {
      setDocumentTitle("Untitled Document");
      setWritingContent("");
      setAiChatHistory([]);
      lastFetchedDocumentIdRef.current = null; // Clear ref for new document
      
      setInitialDocumentTitle("Untitled Document");
      setInitialWritingContent("");
      setInitialAiChatHistory([]);
      setIsLoading(false);
    } else if (documentId) {
      // Only fetch if the documentId has actually changed from the last fetched one
      if (documentId !== lastFetchedDocumentIdRef.current) {
        lastFetchedDocumentIdRef.current = documentId; // Update ref
        loadDocument(documentId);
      }
    } else {
      navigate('/app/canvas', { replace: true });
    }
  }, [documentId, session?.user?.id, supabase, navigate]);

  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hasUnsavedChanges && lastFetchedDocumentIdRef.current) { // Use ref here
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDocument(lastFetchedDocumentIdRef.current!, writingContent, aiChatHistory, documentTitle); // Use ref here
      }, 5000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [writingContent, aiChatHistory, documentTitle, hasUnsavedChanges, saveDocument]);

  const handleContentChange = useCallback((content: string) => {
    setWritingContent(content);
  }, []);

  const handleAIChatHistoryChange = useCallback((history: ChatMessage[]) => {
    setAiChatHistory(history);
  }, []);

  const handleAIDocumentUpdate = useCallback(async (update: { type: 'append' | 'replace'; content: string }) => {
    setAiWritingToCanvas(true);
    setAiDocumentAction(update.type);
    const htmlContent = await markdownToHtml(update.content);
    
    // Convert font family name to a valid Tailwind CSS class name
    const fontClassName = `font-${aiOutputFontFamily.toLowerCase().replace(/\s/g, '-')}`;
    const styledHtmlContent = `<span class="${fontClassName}">${htmlContent}</span>`;

    setWritingContent((prevContent) => {
      if (update.type === 'replace') {
        return styledHtmlContent;
      } else {
        return prevContent.length > 0 ? `${prevContent}<p></p>${styledHtmlContent}` : styledHtmlContent;
      }
    });
    setAiWritingToCanvas(false);
    setAiDocumentAction(null);
  }, [aiOutputFontFamily]);

  const handleDocumentTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
  }, []);

  const handleCloseEditor = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      navigate('/app/canvas');
    }
  };

  const handleConfirmClose = async () => {
    if (lastFetchedDocumentIdRef.current) { // Use ref here
      await saveDocument(lastFetchedDocumentIdRef.current, writingContent, aiChatHistory, documentTitle); // Use ref here
    } else if (writingContent.trim() || aiChatHistory.length > 0) {
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

    if (!lastFetchedDocumentIdRef.current) { // Use ref here
      const newDocId = await createNewDocument(documentTitle);
      if (newDocId) {
        lastFetchedDocumentIdRef.current = newDocId; // Update ref
        await saveDocument(newDocId, writingContent, aiChatHistory, documentTitle);
        navigate(`/app/canvas/${newDocId}`, { replace: true });
      }
    } else {
      await saveDocument(lastFetchedDocumentIdRef.current, writingContent, aiChatHistory, documentTitle); // Use ref here
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
      const plainTextContent = htmlToMarkdownConverter(writingContent);
      exportAsPdf(documentTitle, plainTextContent);
      showSuccess("Document exported as PDF!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to export PDF.");
    }
  };

  const getAiWritingMessage = () => {
    if (aiDocumentAction === 'append') {
      return "JudgiAI is appending...";
    } else if (aiDocumentAction === 'replace') {
      return "JudgiAI is replacing...";
    }
    return "JudgiAI is writing...";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Square className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Loading canvas...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-md border">
        <Input
          value={documentTitle}
          onChange={handleDocumentTitleChange}
          placeholder="Document Title"
          className="w-full max-w-xs sm:max-w-sm md:w-64 text-center text-lg font-semibold h-9"
          disabled={isSaving}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleManualSave}
          disabled={isSaving || !hasUnsavedChanges}
          className={hasUnsavedChanges ? "text-primary" : "text-muted-foreground"}
          aria-label="Save document"
        >
          {isSaving ? <Square className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Export document">
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

        <Button variant="ghost" size="icon" onClick={handleCloseEditor} aria-label="Close editor">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 pt-16">
        <ResizablePanel defaultSize={60} minSize={30}>
          <RichTextEditor
            content={writingContent}
            onContentChange={handleContentChange}
            readOnly={aiWritingToCanvas}
          />
          {aiWritingToCanvas && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Square className="h-4 w-4 animate-spin" />
              <span>{getAiWritingMessage()}</span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CanvasAIAssistant
            writingContent={htmlToMarkdownConverter(writingContent)}
            onAIDocumentUpdate={handleAIDocumentUpdate}
            aiChatHistory={aiChatHistory}
            onAIChatHistoryChange={handleAIChatHistoryChange}
            documentId={documentId} // Pass documentId from useParams
            isAIWritingToCanvas={aiWritingToCanvas}
            aiOutputFontFamily={aiOutputFontFamily}
            setAiOutputFontFamily={setAiOutputFontFamily}
            aiDocumentAction={aiDocumentAction}
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