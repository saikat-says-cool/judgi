"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, MessageSquare, LayoutDashboard, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import ConversationItem from './ConversationItem';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
  isSidebarExpanded: boolean; // New prop
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, isMobile, onClick, isSidebarExpanded }) => (
  <Button
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={cn(
      "w-full justify-start",
      isMobile ? "text-base" : "text-sm",
      !isSidebarExpanded && "justify-center px-0" // Center icon when collapsed
    )}
    onClick={onClick}
  >
    <Link to={to} className="flex items-center">
      {icon}
      {isSidebarExpanded && <span className="ml-2">{label}</span>} {/* Only show label when expanded */}
    </Link>
  </Button>
);

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [isSheetOpen, setIsSheetOpen] = useState(false); // For mobile sheet
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // For desktop sidebar expansion
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const { supabase, session } = useSession();

  const isChatMode = location.pathname.startsWith('/app/chat');

  const closeSheet = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!session?.user?.id || !isChatMode) { // Only fetch if in chat mode
        setLoadingConversations(false);
        setConversations([]); // Clear conversations if not in chat mode
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

    // Realtime listener for conversations
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${session?.user?.id}` }, payload => {
        if (isChatMode) { // Only re-fetch if in chat mode
          fetchConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase, isChatMode]); // Added isChatMode to dependencies

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
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            {isSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {/* Always visible Chat link */}
        <NavLink
          to="/app/chat/new" // Directs to a new chat by default
          icon={<MessageSquare className="h-4 w-4" />}
          label="Chat"
          isActive={isChatMode}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
        {isChatMode && isSidebarExpanded && ( // Only show New Chat button in chat mode and when expanded
          <Button
            variant="default"
            className="w-full justify-start text-sm"
            onClick={handleNewChat}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        )}
        <NavLink
          to="/app/canvas"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Canvas"
          isActive={location.pathname === "/app/canvas"}
          isMobile={isMobile}
          onClick={closeSheet}
          isSidebarExpanded={isSidebarExpanded}
        />
      </div>

      {isChatMode && isSidebarExpanded && ( // Only show recent chats in chat mode and when expanded
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
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
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
        isSidebarExpanded ? "w-64" : "w-16 items-center" // Adjust width and center items when collapsed
      )}
    >
      {sidebarContent}
    </div>
  );
};

export default Sidebar;