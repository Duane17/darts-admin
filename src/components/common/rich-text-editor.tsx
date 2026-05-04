// src/components/common/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { uploadImage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Heading1, Heading2, Quote, Code, 
  ImageIcon, Undo, Redo, Link as LinkIcon, Unlink
} from "lucide-react";
import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface RichTextEditorRef {
  getFinalHtml: () => Promise<string>;
}

// Scoped styles for the ProseMirror editing surface.
const EDITOR_STYLES = `
  .ProseMirror { outline: none; }

  /* Headings */
  .ProseMirror h1 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 1rem 0 0.5rem;
    color: inherit;
  }
  .ProseMirror h2 {
    font-size: 1.35rem;
    font-weight: 600;
    line-height: 1.3;
    margin: 0.875rem 0 0.4rem;
    color: inherit;
  }

  /* Inline marks */
  .ProseMirror strong  { font-weight: 700; }
  .ProseMirror em      { font-style: italic; }
  .ProseMirror u       { text-decoration: underline; }
  .ProseMirror s       { text-decoration: line-through; }

  /* Links */
  .ProseMirror a {
    color: #2563EB;
    text-decoration: underline;
    cursor: pointer;
  }
  .ProseMirror a:hover {
    color: #1D4ED8;
  }
  .dark .ProseMirror a {
    color: #60A5FA;
  }
  .dark .ProseMirror a:hover {
    color: #93C5FD;
  }

  /* Paragraphs */
  .ProseMirror p              { margin: 0.4rem 0; }
  .ProseMirror p:first-child  { margin-top: 0; }

  /* Lists */
  .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .ProseMirror li        { margin: 0.2rem 0; }
  .ProseMirror li > p    { margin: 0; }

  /* Blockquote — uses the project's gold token */
  .ProseMirror blockquote {
    border-left: 3px solid #D4AF37;
    padding-left: 1rem;
    margin: 0.75rem 0;
    color: #6B7280;
    font-style: italic;
  }

  /* Code block */
  .ProseMirror pre {
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 0.375rem;
    padding: 0.75rem 1rem;
    margin: 0.75rem 0;
    overflow-x: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  /* Inline code */
  .ProseMirror code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.85em;
    background: rgba(0, 0, 0, 0.07);
    border-radius: 0.25rem;
    padding: 0.15em 0.35em;
  }
  .ProseMirror pre code {
    background: transparent;
    padding: 0;
    font-size: inherit;
  }

  /* Images */
  .ProseMirror img {
    max-width: 100%;
    border-radius: 0.375rem;
    margin: 0.5rem 0;
    display: block;
  }

  /* Placeholder text */
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #9CA3AF;
    pointer-events: none;
    height: 0;
  }

  /* Dark-mode overrides */
  .dark .ProseMirror code {
    background: rgba(255, 255, 255, 0.1);
  }
  .dark .ProseMirror blockquote {
    color: #9CA3AF;
  }
`;

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange }, ref) => {
    const pendingFiles = useRef<Map<string, File>>(new Map());

    // Controls the inline link input popover in the toolbar
    const [linkInputOpen, setLinkInputOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const linkInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2] },
        }),
        Underline,
        // inclusive: false ensures the mark does NOT extend when typing
        // immediately after the end of a link.
        Link.extend({ inclusive: false }).configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
        Image.configure({ allowBase64: false }),
        ImageResize,
      ],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose prose-sm dark:prose-invert max-w-none min-h-[300px] border rounded-md p-4 focus:outline-none focus:ring-1 focus:ring-ring bg-background",
        },
        handleKeyDown(view, event) {
          // Spacebar exits a link mark — inserts a plain space with the mark stripped
          if (event.key === " ") {
            const { state, dispatch } = view;
            const marks = state.storedMarks ?? state.selection.$from.marks();
            const linkMark = marks.find((m) => m.type.name === "link");
            if (linkMark) {
              dispatch(state.tr.removeStoredMark(linkMark.type).insertText(" "));
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    // Expose getFinalHtml to parent
    useImperativeHandle(ref, () => ({
      async getFinalHtml() {
        if (!editor) return "";
        let html = editor.getHTML();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const images = doc.querySelectorAll("img");

        for (const img of Array.from(images)) {
          const src = img.getAttribute("src");
          if (src && src.startsWith("blob:") && pendingFiles.current.has(src)) {
            const file = pendingFiles.current.get(src)!;
            try {
              const path = await uploadImage({ file, category: "announcements" });
              const fullImageUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
              img.setAttribute("src", fullImageUrl);
              URL.revokeObjectURL(src);
              pendingFiles.current.delete(src);
            } catch (err) {
              console.error("Failed to upload image during final save", err);
            }
          }
        }

        return doc.body.innerHTML;
      }
    }));

    const insertLocalPreview = (file: File) => {
      if (!editor) return;
      const blobUrl = URL.createObjectURL(file);
      pendingFiles.current.set(blobUrl, file);
      editor.chain().focus().setImage({ src: blobUrl }).run();
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) insertLocalPreview(file);
      e.target.value = "";
    };

    // Open the link input, pre-filling any existing href on the selection
    const openLinkInput = useCallback(() => {
      if (!editor) return;
      const existing = editor.getAttributes("link").href ?? "";
      setLinkUrl(existing);
      setLinkInputOpen(true);
      // Focus the input on the next paint
      setTimeout(() => linkInputRef.current?.focus(), 0);
    }, [editor]);

    // Apply or update the link
    const applyLink = useCallback(() => {
      if (!editor) return;
      const url = linkUrl.trim();
      if (!url) return;
      // Prepend https:// if the user didn't include a protocol
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      setLinkInputOpen(false);
      setLinkUrl("");
    }, [editor, linkUrl]);

    const removeLink = useCallback(() => {
      if (!editor) return;
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkInputOpen(false);
      setLinkUrl("");
    }, [editor]);

    const handleLinkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") { e.preventDefault(); applyLink(); }
      if (e.key === "Escape") { setLinkInputOpen(false); setLinkUrl(""); }
    };

    if (!editor) return null;

    const ToolbarButton = ({ 
      onClick, 
      isActive = false, 
      disabled = false, 
      children,
      title
    }: { 
      onClick: () => void; 
      isActive?: boolean; 
      disabled?: boolean; 
      children: React.ReactNode;
      title?: string;
    }) => (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn("h-8 w-8", isActive && "bg-accent text-accent-foreground")}
      >
        {children}
      </Button>
    );

    const isLinkActive = editor.isActive("link");

    return (
      <div className="flex flex-col gap-2">
        <style>{EDITOR_STYLES}</style>

        <div className="flex flex-wrap items-center gap-1 p-1 border rounded-md bg-muted/50 sticky top-0 z-10">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-[1px] h-4 bg-border mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-[1px] h-4 bg-border mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Underline">
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-[1px] h-4 bg-border mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Ordered List">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="Code Block">
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <div className="w-[1px] h-4 bg-border mx-1" />

          {/* ── Link controls ── */}
          <ToolbarButton onClick={openLinkInput} isActive={isLinkActive} title="Insert / edit link">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {isLinkActive && (
            <ToolbarButton onClick={removeLink} title="Remove link">
              <Unlink className="h-4 w-4" />
            </ToolbarButton>
          )}

          {/* Inline URL input — shown when the link button is clicked */}
          {linkInputOpen && (
            <div className="flex items-center gap-1 ml-1">
              <Input
                ref={linkInputRef}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={handleLinkKeyDown}
                placeholder="https://example.com"
                className="h-7 w-48 text-xs px-2"
              />
              <Button
                type="button"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={applyLink}
                disabled={!linkUrl.trim()}
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => { setLinkInputOpen(false); setLinkUrl(""); }}
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="w-[1px] h-4 bg-border mx-1" />

          <div className="relative">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileInputChange} accept="image/*" />
            <Button type="button" variant="ghost" size="sm" className="h-8">
              <ImageIcon className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline text-xs">Add Image</span>
            </Button>
          </div>
        </div>
        
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";