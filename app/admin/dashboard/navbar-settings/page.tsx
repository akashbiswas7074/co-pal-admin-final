"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { getNavbarSettings, updateNavbarSettings } from "@/lib/database/actions/admin/navbar-settings/navbar-settings.actions";

export default function NavbarSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: "",
    backgroundType: "blur",
    backgroundColorValue: "#1a0a2c",
    backgroundGradientValue: "linear-gradient(to right, #1a0a2c, #4a192c)",
    blurOpacity: 40,
    desktopLayout: "inline",
    textColor: "#ffffff"
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const result = await getNavbarSettings();
        if (result.success && result.settings) {
          setSettings({
            id: result.settings._id,
            backgroundType: result.settings.backgroundType || "blur",
            backgroundColorValue: result.settings.backgroundColorValue || "#1a0a2c",
            backgroundGradientValue: result.settings.backgroundGradientValue || "linear-gradient(to right, #1a0a2c, #4a192c)",
            blurOpacity: result.settings.blurOpacity || 40,
            desktopLayout: result.settings.desktopLayout || "inline",
            textColor: result.settings.textColor || "#ffffff"
          });
        }
      } catch (error) {
        console.error("Error loading navbar settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateNavbarSettings(settings);
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Navbar Global Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your website's global navbar background and layout properties.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Desktop Layout</CardTitle>
            <CardDescription>Choose how navigation links are displayed on desktop screens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup 
              value={settings.desktopLayout} 
              onValueChange={(val) => setSettings({...settings, desktopLayout: val})}
              className="flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="inline" id="layout-inline" />
                <Label htmlFor="layout-inline" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-base mb-1">Inline Navigation (Default)</div>
                  <div className="text-sm text-gray-500">Links are displayed in the center of the navbar.</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-md cursor-pointer hover:bg-slate-50">
                <RadioGroupItem value="menu" id="layout-menu" />
                <Label htmlFor="layout-menu" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-base mb-1">Hamburger Menu</div>
                  <div className="text-sm text-gray-500">Links are hidden behind a hamburger menu button.</div>
                </Label>
              </div>
            </RadioGroup>

            <div className="pt-4 border-t space-y-4">
              <Label className="text-base font-semibold">Text Color</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="color" 
                  value={settings.textColor} 
                  onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                  className="w-20 h-10 p-1"
                />
                <Input 
                  type="text" 
                  value={settings.textColor} 
                  onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">Color for the navbar links and icons.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Background Styling</CardTitle>
            <CardDescription>Configure the display style of your navbar background.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Background Type</Label>
              <RadioGroup 
                value={settings.backgroundType} 
                onValueChange={(val) => setSettings({...settings, backgroundType: val})}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blur" id="bg-blur" />
                  <Label htmlFor="bg-blur" className="cursor-pointer">Blur (Glassmorphism)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="solid" id="bg-solid" />
                  <Label htmlFor="bg-solid" className="cursor-pointer">Solid Color</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gradient" id="bg-gradient" />
                  <Label htmlFor="bg-gradient" className="cursor-pointer">Gradient</Label>
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
                    className="w-20 h-10 p-1"
                  />
                  <Label className="font-semibold block mt-4">Blur Opacity / Transparency Value</Label>
                  <p className="text-xs text-gray-500 mb-2">Controls how dark the background is over the page content (0 to 100). Valid typical values: 20, 40, 60.</p>
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
                    <span className="relative z-10 drop-shadow-md">Preview (Glassmorphism)</span>
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
                      className="w-20 h-10 p-1"
                    />
                    <Input 
                      type="text" 
                      value={settings.backgroundColorValue} 
                      onChange={(e) => setSettings({...settings, backgroundColorValue: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                  <div className="mt-4 h-16 rounded-md border flex items-center justify-center text-white" 
                    style={{ backgroundColor: settings.backgroundColorValue }}
                  >
                    <span>Preview Solid Color</span>
                  </div>
                </div>
              )}

              {settings.backgroundType === "gradient" && (() => {
                const colors = settings.backgroundGradientValue.match(/(#[0-9a-fA-F]{3,8})/g) || ["#1a0a2c", "#4a192c"];
                const color1 = colors[0] || "#1a0a2c";
                const color2 = colors[1] || "#4a192c";
                
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
                         <Input type="text" value={color1} onChange={handleColor1Change} className="w-24 uppercase text-xs" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs text-muted-foreground">Color 2 (Right)</Label>
                       <div className="flex items-center gap-2">
                         <Input type="color" value={color2} onChange={handleColor2Change} className="w-16 h-10 p-1 cursor-pointer" />
                         <Input type="text" value={color2} onChange={handleColor2Change} className="w-24 uppercase text-xs" />
                       </div>
                    </div>
                  </div>

                  <div className="mt-4 h-16 rounded-md border flex items-center justify-center text-white font-medium shadow-inner" 
                    style={{ background: settings.backgroundGradientValue }}
                  >
                    <span className="drop-shadow-md">Preview Gradient</span>
                  </div>
                 </div>
                );
              })()}
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
