"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import RichTextEditor from '@/components/RichTextEditor'; // Import the new RichTextEditor
import CanvasAIAssistant from '@/components/CanvasAIAssistant';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { X, Save, Square, FileDown } from 'lucide-react'; // Import Square
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
import { markdownToHtml, htmlToMarkdownConverter } from '@/lib/markdownConverter'; // Import converters

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

  const [writingContent, setWritingContent] = useState<string>(""); // Now stores HTML
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>("Untitled Document");
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [aiWritingToCanvas, setAiWritingToCanvas] = useState(false);
  const [aiDocumentAction, setAiDocumentAction] = useState<'append' | 'replace' | null>(null); // New state for specific AI action
  const [aiOutputFontFamily, setAiOutputFontFamily] = useState('Inter'); // New state for AI output font

  // New states to store the initial loaded/created content for comparison
  const [initialWritingContent, setInitialWritingContent] = useState<string>(""); // Now stores HTML
  const [initialAiChatHistory, setInitialAiChatHistory] = useState<ChatMessage[]>([]);
  const [initialDocumentTitle, setInitialDocumentTitle] = useState<string>("Untitled Document");

  // Derived state for unsaved changes
  const hasUnsavedChanges =
    writingContent !== initialWritingContent ||
    JSON.stringify(aiChatHistory) !== JSON.stringify(initialAiChatHistory) || // Deep compare chat history
    documentTitle !== initialDocumentTitle;

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
    // Update initial states after successful save
    setInitialWritingContent(content);
    setInitialAiChatHistory(chatHistory);
    setInitialDocumentTitle(title);
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
        setWritingContent(data.content); // Content is now HTML
        setAiChatHistory(data.chat_history as ChatMessage[]);
        setCurrentDocumentId(data.id);
        
        // Set initial states upon loading
        setInitialDocumentTitle(data.title);
        setInitialWritingContent(data.content);
        setInitialAiChatHistory(data.chat_history as ChatMessage[]);
      }
      setIsLoading(false);
    };

    if (documentId === 'new') {
      // Start with a blank canvas, will be saved on first content change or explicit save
      setDocumentTitle("Untitled Document");
      setWritingContent(""); // Empty HTML
      setAiChatHistory([]);
      setCurrentDocumentId(null); // No ID until saved
      
      // Set initial states for a new document
      setInitialDocumentTitle("Untitled Document");
      setInitialWritingContent("");
      setInitialAiChatHistory([]);
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
    setWritingContent(content); // Content is now HTML
    // hasUnsavedChanges is now derived, no need to set it here
    // If it's a new document and content is added, prompt for initial save/title
    if (!currentDocumentId && content.trim().length > 0) {
      // This will be handled by the explicit save button or auto-save
    }
  }, [currentDocumentId]);

  const handleAIChatHistoryChange = useCallback((history: ChatMessage[]) => {
    setAiChatHistory(history);
    // hasUnsavedChanges is now derived, no need to set it here
  }, []);

  const handleAIDocumentUpdate = useCallback(async (update: { type: 'append' | 'replace'; content: string }) => {
    setAiWritingToCanvas(true); // Set AI writing state
    setAiDocumentAction(update.type); // Set specific AI action
    const htmlContent = await markdownToHtml(update.content); // Convert AI's Markdown to HTML
    
    // Wrap AI's content with the selected font family using a span
    const styledHtmlContent = `<span style="font-family: ${aiOutputFontFamily}, sans-serif;">${htmlContent}</span>`;

    setWritingContent((prevContent) => {
      if (update.type === 'replace') {
        return styledHtmlContent;
      } else { // 'append'
        return prevContent.length > 0 ? `${prevContent}<p></p>${styledHtmlContent}` : styledHtmlContent; // Add a paragraph break
      }
    });
    // hasUnsavedChanges is now derived, no need to set it here
    setAiWritingToCanvas(false); // Reset AI writing state after content is added
    setAiDocumentAction(null); // Clear specific AI action
  }, [aiOutputFontFamily]); // Dependency on aiOutputFontFamily

  const handleDocumentTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTitle(e.target.value);
    // hasUnsavedChanges is now derived, no need to set it here
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
      // DOCX export expects plain text or simple HTML, so we'll pass the HTML content directly
      // The docx library might need further processing of HTML to DOCX
      await exportAsDocx(documentTitle, writingContent);
      showSuccess("Document exported as DOCX!");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to export DOCX.");
    }
  };

  const handleExportPdf = () => {
    try {
      // PDF export expects plain text, so we'll convert HTML to Markdown then to plain text
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
    return "JudgiAI is writing..."; // Default if action is not specific
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Square className="h-8 w-8 animate-spin text-primary" /> {/* Changed to Square */}
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
          {isSaving ? <Square className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {/* Changed to Square */}
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
          <RichTextEditor
            content={writingContent}
            onContentChange={handleContentChange}
            readOnly={aiWritingToCanvas}
          />
          {aiWritingToCanvas && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              <Square className="h-4 w-4 animate-spin" /> {/* Changed to Square */}
              <span>{getAiWritingMessage()}</span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <CanvasAIAssistant
            writingContent={htmlToMarkdownConverter(writingContent)} // Convert HTML to Markdown for AI context
            onAIDocumentUpdate={handleAIDocumentUpdate}
            aiChatHistory={aiChatHistory}
            onAIChatHistoryChange={handleAIChatHistoryChange}
            documentId={currentDocumentId}
            isAIWritingToCanvas={aiWritingToCanvas}
            aiOutputFontFamily={aiOutputFontFamily} // Pass AI font state
            setAiOutputFontFamily={setAiOutputFontFamily} // Pass AI font setter
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