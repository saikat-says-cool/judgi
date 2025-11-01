"use client";

import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/contexts/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { FileText, PlusCircle, Square } from 'lucide-react'; // Added Square import
import { markdownToHtml } from '@/lib/markdownConverter';

interface Document {
  id: string;
  title: string;
  updated_at: string;
}

interface SaveToCanvasDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentToSave: string; // Markdown content from chat
}

const SaveToCanvasDialog: React.FC<SaveToCanvasDialogProps> = ({ isOpen, onClose, contentToSave }) => {
  const { supabase, session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [newDocumentTitle, setNewDocumentTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = async () => {
    if (!session?.user?.id) {
      setLoadingDocuments(false);
      return;
    }

    setLoadingDocuments(true);
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents for SaveToCanvasDialog:", error);
      showError("Failed to load your documents.");
      setDocuments([]);
    } else if (data) {
      setDocuments(data as Document[]);
      if (data.length > 0) {
        setSelectedDocumentId(data[0].id); // Select the most recent document by default
      }
    }
    setLoadingDocuments(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      setNewDocumentTitle(''); // Clear new document title on open
      setSelectedDocumentId(null); // Reset selection
    }
  }, [isOpen, session?.user?.id, supabase]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to save content.");
      return;
    }

    setIsSaving(true);
    try {
      const htmlContentToSave = await markdownToHtml(contentToSave);
      let targetDocumentId = selectedDocumentId;

      if (!targetDocumentId && newDocumentTitle.trim() === '') {
        showError("Please select an existing document or enter a title for a new document.");
        setIsSaving(false);
        return;
      }

      if (newDocumentTitle.trim() !== '') {
        // Create new document
        const { data: newDocData, error: newDocError } = await supabase
          .from('documents')
          .insert({ user_id: session.user.id, title: newDocumentTitle.trim(), content: htmlContentToSave, chat_history: [] })
          .select('id')
          .single();

        if (newDocError) {
          console.error("Error creating new document:", newDocError);
          showError("Failed to create new document.");
          setIsSaving(false);
          return;
        }
        targetDocumentId = newDocData.id;
        showSuccess(`New document "${newDocumentTitle.trim()}" created and content saved!`);
      } else if (targetDocumentId) {
        // Append to existing document
        const { data: existingDoc, error: fetchError } = await supabase
          .from('documents')
          .select('content')
          .eq('id', targetDocumentId)
          .eq('user_id', session.user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching existing document content:", fetchError);
          showError("Failed to retrieve existing document content.");
          setIsSaving(false);
          return;
        }

        const updatedContent = existingDoc.content.length > 0 
          ? `${existingDoc.content}<p></p>${htmlContentToSave}` 
          : htmlContentToSave;

        const { error: updateError } = await supabase
          .from('documents')
          .update({ content: updatedContent, updated_at: new Date().toISOString() })
          .eq('id', targetDocumentId)
          .eq('user_id', session.user.id);

        if (updateError) {
          console.error("Error updating document:", updateError);
          showError("Failed to save content to document.");
          setIsSaving(false);
          return;
        }
        showSuccess("Content appended to document!");
      }
      onClose();
    } catch (error) {
      console.error("Error during save operation:", error);
      showError("An unexpected error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Save to Canvas</AlertDialogTitle>
          <AlertDialogDescription>
            Select an existing document or create a new one to save this chat message.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <h4 className="text-md font-semibold">Existing Documents</h4>
          {loadingDocuments ? (
            <p className="text-muted-foreground text-sm">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No documents found. Create a new one below.</p>
          ) : (
            <ScrollArea className="h-48 w-full rounded-md border p-4">
              <RadioGroup
                value={selectedDocumentId || ''}
                onValueChange={(value) => {
                  setSelectedDocumentId(value);
                  setNewDocumentTitle(''); // Clear new document title if existing is selected
                }}
              >
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-2 py-1">
                    <RadioGroupItem value={doc.id} id={`doc-${doc.id}`} />
                    <Label htmlFor={`doc-${doc.id}`} className="flex items-center cursor-pointer">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="truncate">{doc.title}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          )}

          <h4 className="text-md font-semibold mt-6">Create New Document</h4>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="New Document Title"
              value={newDocumentTitle}
              onChange={(e) => {
                setNewDocumentTitle(e.target.value);
                if (e.target.value.trim() !== '') {
                  setSelectedDocumentId(null); // Deselect existing if typing new title
                }
              }}
              disabled={isSaving}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (newDocumentTitle.trim() === '') {
                  setNewDocumentTitle('Untitled Document');
                  setSelectedDocumentId(null);
                }
              }}
              disabled={isSaving}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={isSaving || (!selectedDocumentId && newDocumentTitle.trim() === '')}>
            {isSaving ? (
              <>
                <Square className="h-4 w-4 animate-spin mr-2" /> Saving...
              </>
            ) : (
              'Save'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SaveToCanvasDialog;