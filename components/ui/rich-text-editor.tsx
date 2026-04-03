"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "./skeleton";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Eye, Code, Type, Sparkles } from "lucide-react";

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
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#374151'
    },
    extraStyles: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      body { 
        font-family: 'Inter', sans-serif !important; 
        color: #374151;
        line-height: 1.6;
      }
      p { margin-bottom: 1rem; }
      ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
      li { margin-bottom: 0.5rem; }
      h1, h2, h3 { font-weight: 600; color: #111827; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    `
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-muted/50 to-background p-3 border rounded-t-xl group">
        <div className="flex gap-1.5 p-1 bg-muted/30 rounded-lg border w-fit">
          <Button
            type="button"
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className={`h-8 transition-all ${viewMode === 'edit' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Type className="w-3.5 h-3.5 mr-1.5" />
            <span className="font-medium text-xs">Edit Content</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('preview')}
            className={`h-8 transition-all ${viewMode === 'preview' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            <span className="font-medium text-xs">Live Preview</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'code' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('code')}
            className={`h-8 transition-all ${viewMode === 'code' ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Code className="w-3.5 h-3.5 mr-1.5" />
            <span className="font-medium text-xs">View HTML</span>
          </Button>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider bg-background/50 px-2.5 py-1 rounded-full border border-primary/5">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          Pro Editor Active
        </div>
      </div>


      {/* Editor Mode */}
      {viewMode === 'edit' && (
        <div className="border border-t-0 rounded-b-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border-muted flex flex-col min-h-[400px]">
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
        <div className="border border-t-0 rounded-b-xl bg-gray-50 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-1 gap-4 flex-1 overflow-auto max-h-[800px]">
            <div
              className="prose prose-slate max-w-none min-h-[400px] bg-white rounded-lg p-8 shadow-inner border border-gray-100 prose-headings:font-bold prose-p:text-gray-600 prose-li:text-gray-600"
              dangerouslySetInnerHTML={{ __html: localContent }}
            />
          </div>
        </div>
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