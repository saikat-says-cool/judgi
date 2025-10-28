"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, MessageSquare, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSession } from '@/contexts/SessionContext';
import { showError } from '@/utils/toast';
import ConversationItem from './ConversationItem'; // Import the new ConversationItem

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, isMobile, onClick }) => (
  <Button
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={`w-full justify-start ${isMobile ? "text-base" : "text-sm"}`}
    onClick={onClick}
  >
    <Link to={to}>
      {icon}
      <span className="ml-2">{label}</span>
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
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const { supabase, session } = useSession();

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!session?.user?.id) {
        setLoadingConversations(false);
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

    // Realtime listener for conversations (optional, but good for dynamic updates)
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${session?.user?.id}` }, payload => {
        fetchConversations(); // Re-fetch on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, supabase]);

  const handleNewChat = async () => {
    if (!session?.user?.id) {
      showError("You must be logged in to start a new chat.");
      return;
    }
    // Navigate to a special 'new' route, ChatPage will handle creation
    navigate('/app/chat/new');
    closeSidebar();
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
      // If the deleted conversation was the active one, navigate to a new chat
      if (conversationId === id) {
        navigate('/app/chat/new');
      }
    }
  };

  const navItems = [
    { to: "/app/chat/new", label: "New Chat", icon: <PlusCircle className="h-4 w-4" />, action: handleNewChat },
    { to: "/app/canvas", label: "Canvas", icon: <LayoutDashboard className="h-4 w-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-lg font-semibold mb-4">JudgiAI</h2>
      <div className="space-y-2 mb-4">
        <Button
          variant="default"
          className="w-full justify-start text-sm"
          onClick={handleNewChat}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <NavLink
          to="/app/canvas"
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Canvas"
          isActive={location.pathname === "/app/canvas"}
          isMobile={isMobile}
          onClick={closeSidebar}
        />
      </div>

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
                onClick={closeSidebar}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
    <div className="hidden md:flex flex-col h-full w-64 border-r bg-sidebar text-sidebar-foreground">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;