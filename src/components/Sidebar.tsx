"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, MessageSquare, LayoutDashboard, PlusCircle, ChevronLeft, ChevronRight, FileText, User, BookOpen } from 'lucide-react'; // Import User and BookOpen icons
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import ConversationItem from './ConversationItem';
import { cn } from '@/lib/utils';
// Removed ThemeToggle import

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
  isSidebarExpanded: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, isMobile, onClick, isSidebarExpanded }) => (
  <Button
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={cn(
      "w-full justify-start",
      isMobile ? "text-base" : "text-sm",
      !isSidebarExpanded && "justify-center px-0"
    )}
    onClick={onClick}
    aria-label={isSidebarExpanded ? undefined : label} // Add aria-label only when icon-only
  >
    <Link to={to} className="flex items-center">
      {icon}
      {isSidebarExpanded && <span className="ml-2">{label}</span>}
    </Link>
  </Button>
);

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  created_at: string;
}

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { documentId } = useParams<{ documentId?: string }>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const { supabase, session } = useSession();

  const isChatMode = location.pathname.startsWith('/app/chat');
  const isCanvasMode = location.pathname.startsWith('/app/canvas');
  const isCanvasHomePage = location.pathname === '/app/canvas';
  const isProfileMode = location.pathname === '/app/profile';
  const isInstructionsMode = location.pathname === '/app/instructions'; // New state for instructions mode

  const closeSheet = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  // Fetch Conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!session?.user?.id || !isChatMode) {
        setLoadingConversations(false);
        setConversations([]);
        return;
      }

      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        showError("Failed to load conversations.");
      } else if (data) {
        setConversations(data as Conversation[]);
      }
      setLoadingConversations(false);
    };

    fetchConversations();

    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${session?.user?.id}` }, payload => {
        if (isChatMode) {
          fetchConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase, isChatMode]);

  // Fetch Documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session?.user?.id || !isCanvasHomePage) {
        setLoadingDocuments(false);
        setDocuments([]);
        return;
      }

      setLoadingDocuments(true);
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error);
        showError("Failed to load documents.");
      } else if (data) {
        setDocuments(data as Document[]);
      }
      setLoadingDocuments(false);
    };

    fetchDocuments();

    const channel = supabase
      .channel('public:documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${session?.user?.id}` }, payload => {
        if (isCanvasHomePage) {
          fetchDocuments();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase, isCanvasHomePage]);


  const handleNewChat = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to start a new chat.");
      return;
    }
    navigate('/app/chat/new');
    closeSheet();
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to rename a chat.");
      return;
    }
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error renaming conversation:", error);
      showError("Failed to rename conversation.");
    } else {
      setConversations(prev => prev.map(conv => conv.id === id ? { ...conv, title: newTitle } : conv));
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (!session?.user?.id) {
      showError("You must be logged in to delete a chat.");
      return;
    }
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error("Error deleting conversation:", error);
      showError("Failed to delete conversation.");
    } else {
      setConversations(prev => prev.filter(conv => conv.id !== id));
      if (conversationId === id) {
        navigate('/app/chat/new');
      }
    }
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        {isSidebarExpanded && <h2 className="text-lg font-semibold">JudgiAI</h2>}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8" aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}>
            {isSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <NavLink
          to="/app/chat/new"
          icon={<MessageSquare className="h-4 w-4" />}
          label="New Chat"
          isActive={isChatMode}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
        <NavLink
          to="/app/canvas"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Canvas"
          isActive={isCanvasMode}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
        <NavLink
          to="/app/profile"
          icon={<User className="h-4 w-4" />}
          label="Profile"
          isActive={isProfileMode}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
        <NavLink
          to="/app/instructions"
          icon={<BookOpen className="h-4 w-4" />}
          label="Instructions"
          isActive={isInstructionsMode}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
      </div>

      {isChatMode && isSidebarExpanded && (
        <>
          <div className="mb-2 text-sm font-medium text-muted-foreground">Recent Chats</div>
          {loadingConversations ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent chats.</p>
          ) : (
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    isActive={conversationId === conv.id}
                    onRename={handleRenameConversation}
                    onDelete={handleDeleteConversation}
                    isMobile={isMobile}
                    onClick={closeSheet}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {isCanvasHomePage && isSidebarExpanded && (
        <>
          <div className="mb-2 text-sm font-medium text-muted-foreground mt-4">Recent Documents</div>
          {loadingDocuments ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent documents.</p>
          ) : (
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-1">
                {documents.map((doc) => (
                  <Button
                    key={doc.id}
                    asChild
                    variant={documentId === doc.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={closeSheet}
                    aria-label={`Open document ${doc.title}`}
                  >
                    <Link to={`/app/canvas/${doc.id}`} className="flex items-center overflow-hidden whitespace-nowrap">
                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{doc.title}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {/* Removed ThemeToggle component */}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50" aria-label="Open sidebar menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isSidebarExpanded ? "w-64" : "w-16 items-center"
      )}
    >
      {sidebarContent}
    </div>
  );
};

export default Sidebar;