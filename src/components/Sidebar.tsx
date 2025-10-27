"use client";

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Conversation {
  id: string;
  title: string; // First message of the conversation
}

interface SidebarProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
  isDesktopOpen: boolean; // For desktop, controlled by parent
  onToggleDesktopSidebar: () => void; // For desktop
}

const SidebarContent: React.FC<{
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
  onClose?: () => void; // For mobile sheet to close on selection
}> = ({ conversations, onSelectConversation, onNewConversation, currentConversationId, onClose }) => (
  <div className="flex h-full flex-col py-4">
    <div className="px-4 mb-4 flex justify-between items-center">
      <h2 className="text-lg font-semibold text-foreground">Chats</h2>
      <Button variant="ghost" size="icon" onClick={onNewConversation} aria-label="New Chat">
        <PlusCircle className="h-5 w-5" />
      </Button>
    </div>
    <div className="flex-grow overflow-y-auto px-2">
      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2">No past conversations.</p>
      ) : (
        <nav className="grid gap-1">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={conv.id === currentConversationId ? "secondary" : "ghost"}
              className="justify-start h-auto py-2 px-3 text-left whitespace-normal break-words"
              onClick={() => {
                onSelectConversation(conv.id);
                onClose?.(); // Close sheet on mobile after selection
              }}
            >
              {conv.title}
            </Button>
          ))}
        </nav>
      )}
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  currentConversationId,
  isDesktopOpen,
  onToggleDesktopSidebar,
}) => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            conversations={conversations}
            onSelectConversation={onSelectConversation}
            onNewConversation={onNewConversation}
            currentConversationId={currentConversationId}
            onClose={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view
  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full border-r bg-sidebar-background transition-all duration-300 ease-in-out",
        isDesktopOpen ? "w-64" : "w-0 overflow-hidden"
      )}
    >
      {isDesktopOpen && (
        <SidebarContent
          conversations={conversations}
          onSelectConversation={onSelectConversation}
          onNewConversation={onNewConversation}
          currentConversationId={currentConversationId}
        />
      )}
    </div>
  );
};

export default Sidebar;