"use client";

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle, MoreHorizontal, Edit, Trash, User } from "lucide-react"; // Import User icon
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface Conversation {
  id: string;
  title: string; // First message of the conversation
}

interface SidebarProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentConversationId: string | null;
  isDesktopOpen: boolean; // For desktop, controlled by parent
  onToggleDesktopSidebar: () => void; // For desktop
}

const SidebarContent: React.FC<{
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentConversationId: string | null;
  onClose?: () => void; // For mobile sheet to close on selection
}> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  currentConversationId,
  onClose,
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [renameInput, setRenameInput] = React.useState("");
  const [currentRenameConvId, setCurrentRenameConvId] = React.useState<string | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleRenameClick = (conv: Conversation) => {
    setCurrentRenameConvId(conv.id);
    setRenameInput(conv.title);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (currentRenameConvId && renameInput.trim()) {
      onRenameConversation(currentRenameConvId, renameInput.trim());
      setIsRenameDialogOpen(false);
      setRenameInput("");
      setCurrentRenameConvId(null);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    onClose?.(); // Close sidebar on navigation
  };

  return (
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
              <div key={conv.id} className="flex items-center justify-between group">
                <Button
                  variant={conv.id === currentConversationId ? "secondary" : "ghost"}
                  className="justify-start h-auto py-2 px-3 text-left whitespace-normal break-words flex-grow"
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose?.();
                  }}
                >
                  {conv.title}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Conversation options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRenameClick(conv)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            conversation and remove its data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteConversation(conv.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* Profile Button at the bottom */}
      <div className="mt-auto px-2 pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start flex items-center gap-2"
          onClick={handleProfileClick}
        >
          <User className="h-5 w-5" />
          Profile
        </Button>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new title for your conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Title
              </Label>
              <Input
                id="name"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="col-span-3"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
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
            onRenameConversation={onRenameConversation}
            onDeleteConversation={onDeleteConversation}
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
          onRenameConversation={onRenameConversation}
          onDeleteConversation={onDeleteConversation}
          currentConversationId={currentConversationId}
        />
      )}
    </div>
  );
};

export default Sidebar;