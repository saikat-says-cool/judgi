"use client";

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MessageSquare, Edit, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"; // Import ContextMenu components

interface ConversationItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  isMobile?: boolean;
  onClick?: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  id,
  title,
  isActive,
  onRename,
  onDelete,
  isMobile,
  onClick,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== title) {
      onRename(id, newTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setNewTitle(title);
    setIsEditing(false);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex items-center group w-full">
          {isEditing ? (
            <div className="flex-1 flex items-center space-x-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="h-8 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={handleRename} className="h-8 w-8" aria-label="Confirm rename">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8" aria-label="Cancel rename">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              asChild
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "flex-1 justify-start pr-2 min-w-0",
                isMobile ? "text-base" : "text-sm"
              )}
              onClick={onClick}
            >
              <Link to={`/app/chat/${id}`} className="flex items-center overflow-hidden whitespace-nowrap">
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </Link>
            </Button>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40 p-1">
        <ContextMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </ContextMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ContextMenuItem className="w-full justify-start text-sm text-destructive hover:text-destructive cursor-pointer" onSelect={(e) => e.preventDefault()}> {/* Prevent ContextMenu from closing on trigger click */}
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                conversation and all associated messages.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ConversationItem;