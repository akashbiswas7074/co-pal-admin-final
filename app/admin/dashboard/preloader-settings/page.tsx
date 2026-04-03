'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from '@/components/admin/ImageUploader';
import { getPreloaderSettings, updatePreloaderSettings } from '@/lib/database/actions/admin/preloader-settings/preloader-settings.actions';

export default function PreloaderSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    logoUrl: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const result = await getPreloaderSettings();
        if (result.success && result.settings) {
          setSettings({
            logoUrl: result.settings.logoUrl || '',
            isActive: result.settings.isActive !== false,
          });
        }
      } catch (error) {
        console.error("Error fetching preloader settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updatePreloaderSettings(settings);
      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Preloader animation settings have been updated.",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadComplete = (url: string) => {
    setSettings({ ...settings, logoUrl: url });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Preloader Animation Settings</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Custom Preloader Logo</CardTitle>
            <CardDescription>
              Upload an SVG formatted file here. The Web App will automatically extract its paths and animate them line-by-line during website load.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
              <Switch
                id="preloader-active"
                checked={settings.isActive}
                onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
              />
              <Label htmlFor="preloader-active" className="cursor-pointer font-medium">
                {settings.isActive ? "Custom Preloader is Active" : "Fallback to Default Animation"}
              </Label>
            </div>

            <div className="mt-6">
              <ImageUploader
                label="Preloader SVG File"
                helpText="Upload an .svg file for dynamic path animations. If you upload a PNG/JPG, it will gently fade in."
                existingImageUrl={settings.logoUrl}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Animation Requirements</CardTitle>
            <CardDescription>How the stroke drawing effect works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md">
              <h4 className="font-semibold mb-2">For best results:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Export your logo as an <strong>SVG</strong> specifically from Adobe Illustrator or Figma.</li>
                <li>Make sure all strokes and shapes are converted to <strong>Vector Paths</strong>. Primitive SVG shapes (like rects) are not animated.</li>
                <li>Dark lines (`#000000`) or empty strokes are automatically inverted to pure White so they contrast against the black loading screen.</li>
                <li>Avoid highly complex multi-layered clipping masks if possible.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
