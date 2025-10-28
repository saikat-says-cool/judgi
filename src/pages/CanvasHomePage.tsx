"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, FileText, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CanvasHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { supabase, session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchDocuments = async () => {
    if (!session?.user?.id) {
      setLoadingDocuments(false);
      return;
    }

    setLoadingDocuments(true);
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      showError("Failed to load documents.");
      setDocuments([]);
    } else if (data) {
      setDocuments(data as Document[]);
    }
    setLoadingDocuments(false);
  };

  useEffect(() => {
    fetchDocuments();

    const channel = supabase
      .channel('public:documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${session?.user?.id}` }, payload => {
        fetchDocuments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase]);

  const handleCreateNewCanvas = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to create a new canvas.");
      return;
    }
    // Navigate to a new canvas editor page, which will handle initial save
    navigate('/app/canvas/new');
  };

  const handleOpenCanvas = (id: string) => {
    navigate(`/app/canvas/${id}`);
  };

  const handleRenameDocument = async (id: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to rename a document.");
      return;
    }
    if (newTitle.trim() && newTitle !== documents.find(doc => doc.id === id)?.title) {
      const { error } = await supabase
        .from('documents')
        .update({ title: newTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error renaming document:", error);
        showError("Failed to rename document.");
      } else {
        setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, title: newTitle.trim() } : doc));
      }
    }
    setEditingDocId(null);
    setNewTitle('');
  };

  const handleDeleteDocument = async (id: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to delete a document.");
      return;
    }
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error deleting document:", error);
      showError("Failed to delete document.");
    } else {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 bg-background text-foreground">
      <Card className="w-full max-w-2xl p-6 text-center bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-4">Your Canvas Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-8">Start a new legal document or continue working on a recent one.</p>
          <Button
            size="lg"
            onClick={handleCreateNewCanvas}
            className="px-8 py-4 text-lg mb-8"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Create New Canvas
          </Button>

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-left">Recent Canvases</h3>
            {loadingDocuments ? (
              <p className="text-muted-foreground text-left">Loading recent documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-muted-foreground text-left">No recent documents. Create one to get started!</p>
            ) : (
              <ScrollArea className="h-64 w-full pr-4">
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center flex-grow min-w-0">
                        <FileText className="h-5 w-5 mr-3 text-muted-foreground flex-shrink-0" />
                        {editingDocId === doc.id ? (
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onBlur={() => handleRenameDocument(doc.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameDocument(doc.id);
                              if (e.key === 'Escape') {
                                setEditingDocId(null);
                                setNewTitle('');
                              }
                            }}
                            className="h-8 text-sm flex-grow"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="text-lg font-medium truncate cursor-pointer flex-grow text-left"
                            onClick={() => handleOpenCanvas(doc.id)}
                          >
                            {doc.title}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                        {editingDocId !== doc.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingDocId(doc.id);
                              setNewTitle(doc.title);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                document "{doc.title}" and all its content and chat history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDocument(doc.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CanvasHomePage;