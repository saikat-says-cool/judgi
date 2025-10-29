"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Type, Heading1, Heading2, Heading3, HighlightIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string; // HTML content
  onContentChange: (content: string) => void;
  readOnly?: boolean;
}

const fonts = [
  { name: 'Inter', style: 'font-inter' },
  { name: 'Comfortaa', style: 'font-comfortaa' },
  { name: 'Arial', style: 'font-arial' },
  { name: 'Times New Roman', style: 'font-times' },
  { name: 'Courier New', style: 'font-courier' },
  { name: 'Georgia', style: 'font-georgia' },
  { name: 'Verdana', style: 'font-verdana' },
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onContentChange, readOnly = false }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none h-full overflow-auto p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false); // false to prevent triggering onUpdate
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setOptions({ editable: !readOnly });
    }
  }, [readOnly, editor]);

  const setFontFamily = useCallback((fontFamily: string) => {
    editor?.chain().focus().setFontFamily(fontFamily).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border rounded-md bg-background text-foreground">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            variant={editor.isActive('code') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Code className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Type className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className={cn(editor.isActive('paragraph') && 'bg-accent')}>
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn(editor.isActive('heading', { level: 1 }) && 'bg-accent')}>
                <Heading1 className="h-4 w-4 mr-2" /> Heading 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn(editor.isActive('heading', { level: 2 }) && 'bg-accent')}>
                <Heading2 className="h-4 w-4 mr-2" /> Heading 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={cn(editor.isActive('heading', { level: 3 }) && 'bg-accent')}>
                <Heading3 className="h-4 w-4 mr-2" /> Heading 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={!editor.can().chain().focus().toggleBlockquote().run()}
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            size="icon"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Select onValueChange={setFontFamily} value={editor.getAttributes('textStyle').fontFamily || 'Inter'}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Select Font" />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font.name} value={font.name} className={font.style}>
                  {font.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
            size="icon"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
            size="icon"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
            size="icon"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
            size="icon"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            variant="ghost"
            size="icon"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            variant="ghost"
            size="icon"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      <EditorContent editor={editor} className="flex-1 overflow-hidden" />
    </div>
  );
};

export default RichTextEditor;