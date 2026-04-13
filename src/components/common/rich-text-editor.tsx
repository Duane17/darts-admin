// src/components/common/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import ImageResize from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import { uploadImage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  List, ListOrdered, Heading1, Heading2, Quote, Code, 
  ImageIcon, Undo, Redo 
} from "lucide-react";
import React, { useState, useImperativeHandle, forwardRef, useRef } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface RichTextEditorRef {
  getFinalHtml: () => Promise<string>;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange }, ref) => {
    // Map to keep track of blobUrl -> File object
    const pendingFiles = useRef<Map<string, File>>(new Map());

    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        Image.configure({ allowBase64: false }),
        ImageResize,
      ],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "prose prose-sm dark:prose-invert max-w-none min-h-[250px] border rounded-md p-4 focus:outline-none focus:ring-1 focus:ring-ring bg-background",
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    // Expose this method to the parent component
    useImperativeHandle(ref, () => ({
      async getFinalHtml() {
        if (!editor) return "";
        let html = editor.getHTML();

        // 1. Find all images in the content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const images = doc.querySelectorAll("img");
        
        // 2. Upload only the ones that are still blob URLs
        for (const img of Array.from(images)) {
          const src = img.getAttribute("src");
          if (src && src.startsWith("blob:") && pendingFiles.current.has(src)) {
            const file = pendingFiles.current.get(src)!;
            try {
              const path = await uploadImage({ file, category: "announcements" });
              const fullImageUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
              img.setAttribute("src", fullImageUrl);
              
              // Clean up memory
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

    if (!editor) return null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1 p-1 border rounded-md bg-muted/50">
          <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
          <div className="w-[1px] h-4 bg-border mx-1" />
          <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""}><Heading1 className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "bg-accent" : ""}><Bold className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-accent" : ""}><Italic className="h-4 w-4" /></Button>
          
          <div className="w-[1px] h-4 bg-border mx-1" />

          <div className="relative">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFileInputChange} accept="image/*" />
            <Button type="button" variant="ghost" size="sm">
              <ImageIcon className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Add Image</span>
            </Button>
          </div>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";