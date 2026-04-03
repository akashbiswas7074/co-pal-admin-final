"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { generateWebsiteSeoContent } from "@/lib/ai-service";
import { Badge } from "@/components/ui/badge";

interface SeoAiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: {
    siteName: string;
    defaultTitle: string;
    siteDescription: string;
    siteKeywords: string[];
    ogTitle: string;
    ogDescription: string;
  }) => void;
}

export function SeoAiModal({ open, onOpenChange, onApply }: SeoAiModalProps) {
  const [brandName, setBrandName] = useState("");
  const [niche, setNiche] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);

  const handleGenerate = async () => {
    if (!brandName || !niche) {
      toast.error("Please enter both brand name and niche");
      return;
    }

    setIsGenerating(true);
    try {
      const data = await generateWebsiteSeoContent(brandName, niche);
      if (data) {
        setSuggestion(data);
        toast.success("AI SEO Suggestions Generated!");
      } else {
        toast.error("Failed to generate SEO content. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
      onOpenChange(false);
      setSuggestion(null);
      setBrandName("");
      setNiche("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Magic SEO Assistant
          </DialogTitle>
          <DialogDescription>
            Generate professional SEO metadata for your website using AI.
          </DialogDescription>
        </DialogHeader>

        {!suggestion ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="e.g. Peed's Fashion"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Niche / Target Audience</Label>
              <Textarea
                id="niche"
                placeholder="e.g. Luxury e-commerce for premium leather goods and minimalist lifestyle accessories."
                rows={3}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Niche...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate SEO Metadata
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Suggested Site Name</Label>
                <p className="font-medium">{suggestion.siteName}</p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Suggested Default Title</Label>
                <p className="font-medium">{suggestion.defaultTitle}</p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Suggested Description</Label>
                <p className="text-sm">{suggestion.siteDescription}</p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">Keywords</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestion.siteKeywords.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setSuggestion(null)}
              >
                Try Again
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handleApply}
              >
                <Check className="mr-2 h-4 w-4" />
                Apply Suggestions
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
