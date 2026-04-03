"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getFooterSettings, updateFooterSettings } from "@/lib/database/actions/admin/footer-settings/footer-settings.actions";

export default function FooterSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: "",
    backgroundType: "mesh",
    backgroundColorValue: "#111827",
    backgroundGradientValue: "linear-gradient(to right, #111827, #1f2937)",
    blurOpacity: 40,
    textColor: "#ffffff"
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await getFooterSettings();
        if (result.success && result.settings) {
          setSettings({
            id: result.settings._id,
            backgroundType: result.settings.backgroundType || "mesh",
            backgroundColorValue: result.settings.backgroundColorValue || "#111827",
            backgroundGradientValue: result.settings.backgroundGradientValue || "linear-gradient(to right, #111827, #1f2937)",
            blurOpacity: result.settings.blurOpacity ?? 40,
            textColor: result.settings.textColor || "#ffffff"
          });
        }
      } catch (error) {
        console.error("Error loading footer settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateFooterSettings(settings);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        if (result.settings && !settings.id) {
            setSettings(prev => ({...prev, id: result.settings._id}));
        }
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Footer Global Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your website's footer background and styling properties.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Text Appearance</CardTitle>
            <CardDescription>Configure colors affecting hyperlinks and text paragraphs in your footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Text Color</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="color" 
                  value={settings.textColor} 
                  onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input 
                  type="text" 
                  value={settings.textColor} 
                  onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                  className="flex-1 uppercase font-mono"
                />
              </div>
              <p className="text-xs text-gray-500">Global Text Color for the standard links, addresses, and lists.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background Styling</CardTitle>
            <CardDescription>Configure the display style of your footer background.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Background Type</Label>
              <RadioGroup 
                value={settings.backgroundType} 
                onValueChange={(val: any) => setSettings({...settings, backgroundType: val})}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="solid" id="bg-solid" />
                  <Label htmlFor="bg-solid" className="cursor-pointer">Solid Color</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gradient" id="bg-gradient" />
                  <Label htmlFor="bg-gradient" className="cursor-pointer">Gradient</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mesh" id="bg-mesh" />
                  <Label htmlFor="bg-mesh" className="cursor-pointer">Aurora Mesh</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blur" id="bg-blur" />
                  <Label htmlFor="bg-blur" className="cursor-pointer">Blur (Glass)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="pt-4 border-t space-y-4">
              {settings.backgroundType === "blur" && (
                <div className="space-y-3">
                  <Label className="font-semibold">Base Color</Label>
                  <Input 
                    type="color" 
                    value={settings.backgroundColorValue} 
                    onChange={(e) => setSettings({...settings, backgroundColorValue: e.target.value})}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Label className="font-semibold block mt-4">Blur Opacity / Transparency Value</Label>
                  <p className="text-xs text-gray-500 mb-2">Controls how dark the background is over the page content (0 to 100).</p>
                  <Input 
                    type="number" 
                    min="0" max="100"
                    value={settings.blurOpacity} 
                    onChange={(e) => setSettings({...settings, blurOpacity: Number(e.target.value)})}
                    className="w-full"
                  />
                  
                  <div className="mt-4 p-4 rounded-md border text-white font-medium flex items-center justify-center uppercase tracking-widest relative" 
                    style={{
                      background: `url('https://images.unsplash.com/photo-1557683316-973673baf926') center/cover`
                    }}
                  >
                    <div 
                      className="absolute inset-0 backdrop-blur-xl transition-all"
                      style={{
                        backgroundColor: settings.backgroundColorValue,
                        opacity: settings.blurOpacity / 100
                      }}
                    ></div>
                    <span className="relative z-10 drop-shadow-md" style={{ color: settings.textColor }}>Preview Glass Footer</span>
                  </div>
                </div>
              )}

              {settings.backgroundType === "solid" && (
                <div className="space-y-3">
                  <Label className="font-semibold">Solid Hex Color</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="color" 
                      value={settings.backgroundColorValue} 
                      onChange={(e) => setSettings({...settings, backgroundColorValue: e.target.value})}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      type="text" 
                      value={settings.backgroundColorValue} 
                      onChange={(e) => setSettings({...settings, backgroundColorValue: e.target.value})}
                      className="flex-1 uppercase font-mono"
                    />
                  </div>
                  <div className="mt-4 h-16 rounded-md border flex items-center justify-center text-white" 
                    style={{ backgroundColor: settings.backgroundColorValue, color: settings.textColor }}
                  >
                    <span>Preview Solid Footer</span>
                  </div>
                </div>
              )}

              {settings.backgroundType === "gradient" && (() => {
                const colors = settings.backgroundGradientValue.match(/(#[0-9a-fA-F]{3,8})/g) || ["#111827", "#1f2937"];
                const color1 = colors[0] || "#111827";
                const color2 = colors[1] || "#1f2937";
                
                const handleColor1Change = (e: any) => {
                  setSettings({...settings, backgroundGradientValue: `linear-gradient(to right, ${e.target.value}, ${color2})`});
                };
                
                const handleColor2Change = (e: any) => {
                  setSettings({...settings, backgroundGradientValue: `linear-gradient(to right, ${color1}, ${e.target.value})`});
                };

                return (
                 <div className="space-y-3">
                  <Label className="font-semibold">Gradient Colors</Label>
                  <p className="text-xs text-gray-500 mb-2">Select two colors to create a beautiful horizontal gradient.</p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                    <div className="space-y-2">
                       <Label className="text-xs text-muted-foreground">Color 1 (Left)</Label>
                       <div className="flex items-center gap-2">
                         <Input type="color" value={color1} onChange={handleColor1Change} className="w-16 h-10 p-1 cursor-pointer" />
                         <Input type="text" value={color1} onChange={handleColor1Change} className="w-24 uppercase text-xs font-mono" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs text-muted-foreground">Color 2 (Right)</Label>
                       <div className="flex items-center gap-2">
                         <Input type="color" value={color2} onChange={handleColor2Change} className="w-16 h-10 p-1 cursor-pointer" />
                         <Input type="text" value={color2} onChange={handleColor2Change} className="w-24 uppercase text-xs font-mono" />
                       </div>
                    </div>
                  </div>

                  <div className="mt-4 h-16 rounded-md border flex items-center justify-center text-white font-medium shadow-inner" 
                    style={{ background: settings.backgroundGradientValue, color: settings.textColor }}
                  >
                    <span className="drop-shadow-md">Preview Gradient Footer</span>
                  </div>
                 </div>
                );
              })()}
              {settings.backgroundType === "mesh" && (
                <div className="space-y-3">
                  <Label className="font-semibold">Aurora Mesh Parameters</Label>
                  <p className="text-sm text-gray-500 mb-2">The Aurora Mesh gradient comes pre-configured with a modern multi-layered radial spread across the document.</p>
                  <div className="mt-4 p-8 rounded-md border flex items-center justify-center text-white relative overflow-hidden" 
                    style={{ 
                      background: `
                        radial-gradient(ellipse at 0% 100%, rgba(120, 40, 200, 0.55) 0%, transparent 50%),
                        radial-gradient(ellipse at 20% 60%, rgba(0, 180, 160, 0.35) 0%, transparent 45%),
                        radial-gradient(ellipse at 100% 100%, rgba(80, 140, 60, 0.4) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(30, 20, 60, 0.8) 0%, transparent 70%),
                        #111827
                      `,
                      color: settings.textColor 
                    }}
                  >
                    <span className="drop-shadow-md relative z-10 text-xl font-bold">Preview Aurora Mesh</span>
                  </div>
                </div>
              )}
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
