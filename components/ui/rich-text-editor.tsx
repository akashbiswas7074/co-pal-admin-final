"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "./skeleton";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Eye, Code, Type } from "lucide-react";

// Import Jodit Editor with dynamic import
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

// Loading skeleton
const EditorSkeleton = () => (
  <div className="border rounded-md p-4 min-h-[400px] flex items-center justify-center bg-muted/20">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-pulse flex space-x-2">
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce"></div>
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce delay-150"></div>
        <div className="h-4 w-4 bg-muted rounded-full animate-bounce delay-300"></div>
      </div>
      <p className="text-muted-foreground text-sm">Loading editor...</p>
    </div>
  </div>
);

// Props interface
interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  placeholder?: string;
  tabIndex?: number;
  className?: string;
  config?: any;
}

// Jodit config creator
export const createJoditConfig = (isMobile: boolean, height: number, placeholder: string, tabIndex?: number): any => {
  return {
    readonly: false,
    height: height,
    width: '100%',
    language: 'en',
    direction: 'ltr',
    theme: 'default',
    enter: 'br',
    toolbarSticky: true,
    toolbarStickyOffset: 0,
    placeholder: placeholder,
    tabIndex: tabIndex,
    beautifyHTML: true,
    removeEmptyTags: true,
    buttons: isMobile
      ? ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'link', 'image', '|', 'fullsize']
      : [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'fontsize', 'brush', '|',
        'image', 'table', 'link', 'hr', '|',
        'align', '|',
        'undo', 'redo', '|',
        'fullsize'
      ],
    toolbarAdaptive: isMobile,
    sizeLG: 900,
    sizeMD: 700,
    sizeSM: 400,
    allowResizeY: true,
    spellcheck: true,
    enableDragAndDropFileToEditor: true,
    uploader: {
      insertImageAsBase64URI: true
    },
    style: {
      fontSize: '16px',
      lineHeight: '1.6',
    },
  };
};

// Default config export
export const joditConfig = createJoditConfig(false, 500, "Start writing...");

export function RichTextEditor({
  value,
  onChange,
  height = 500,
  placeholder = "Start writing...",
  tabIndex,
  className,
  config: externalConfig,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');

  // Local content state - this is the key to preventing auto-save
  const [localContent, setLocalContent] = useState(value);

  // Sync local content when value prop changes (e.g., on initial load)
  useEffect(() => {
    setLocalContent(value);
  }, [value]);

  // Only render on client-side
  useEffect(() => {
    setIsMounted(true);
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Merge configs
  const config = externalConfig
    ? { ...createJoditConfig(isMobile, height, placeholder, tabIndex), ...externalConfig }
    : createJoditConfig(isMobile, height, placeholder, tabIndex);

  // Handle content change - only updates local state, NOT parent
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    // Call parent onChange to update the ref/form state
    onChange(newContent);
  };

  if (!isMounted) {
    return <EditorSkeleton />;
  }

  return (
    <div className={`relative space-y-2 ${className || ''}`}>
      {/* Simple Tab Controls */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          type="button"
          variant={viewMode === 'edit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('edit')}
        >
          <Type className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          type="button"
          variant={viewMode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('preview')}
        >
          <Eye className="w-4 h-4 mr-1" />
          Preview
        </Button>
        <Button
          type="button"
          variant={viewMode === 'code' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('code')}
        >
          <Code className="w-4 h-4 mr-1" />
          HTML
        </Button>
      </div>

      {/* Editor Mode */}
      {viewMode === 'edit' && (
        <div className="border rounded-md">
          <JoditEditor
            ref={editorRef}
            value={localContent}
            config={config}
            onBlur={(newContent: string) => handleContentChange(newContent)}
          />
        </div>
      )}

      {/* Preview Mode */}
      {viewMode === 'preview' && (
        <Card>
          <CardContent className="p-4">
            <div
              className="prose max-w-none min-h-[300px] bg-white rounded-md p-4 border"
              dangerouslySetInnerHTML={{ __html: localContent }}
            />
          </CardContent>
        </Card>
      )}

      {/* Code Mode */}
      {viewMode === 'code' && (
        <Card>
          <CardContent className="p-4">
            <textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full font-mono text-sm min-h-[400px] p-3 border rounded-md bg-gray-50"
              placeholder="HTML code..."
            />
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <div className="text-xs text-muted-foreground">
        Mode: {viewMode} | Characters: {localContent.replace(/<[^>]*>/g, '').length}
      </div>
    </div>
  );
}