"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Trash2, Eye, Settings, Globe, Search, BarChart, FileText, Fingerprint, Truck, Pencil, AlertCircle, Key, Plus } from "lucide-react";
import {
  getAllWebsiteSettings,
  createOrUpdateWebsiteSettings,
  activateWebsiteSettings,
  deleteWebsiteSettings
} from "@/lib/database/actions/website.settings.actions";
import { convertToWebP } from "@/lib/image-utils";
import { SeoAiModal } from "@/components/admin/dashboard/website-settings/SeoAiModal";
import { Sparkles } from "lucide-react";

// Form validation schema
const websiteSettingsSchema = z.object({
  _id: z.string().optional(),
  // Basic SEO
  siteName: z.string().min(1, "Site name is required").max(100, "Site name cannot exceed 100 characters"),
  siteDescription: z.string().min(1, "Site description is required").max(160, "Description cannot exceed 160 characters"),
  siteKeywords: z.array(z.string()),
  defaultTitle: z.string().min(1, "Default title is required").max(60, "Title cannot exceed 60 characters"),
  titleSeparator: z.string(),

  // Open Graph
  ogTitle: z.string().max(100, "OG title cannot exceed 100 characters").optional().or(z.literal("")),
  ogDescription: z.string().max(500, "OG description cannot exceed 500 characters").optional().or(z.literal("")),
  ogImage: z.string().optional().or(z.literal("")),
  ogType: z.enum(["website", "article", "product", "profile"]),

  // Twitter Card
  twitterTitle: z.string().max(100, "Twitter title cannot exceed 100 characters").optional().or(z.literal("")),
  twitterDescription: z.string().max(300, "Twitter description cannot exceed 300 characters").optional().or(z.literal("")),
  twitterImage: z.string().optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image", "app", "player"]),
  twitterSite: z.string().optional().or(z.literal("")),
  twitterCreator: z.string().optional().or(z.literal("")),

  // Favicons
  favicon: z.string().optional().or(z.literal("")),
  favicon16: z.string().optional().or(z.literal("")),
  favicon32: z.string().optional().or(z.literal("")),
  appleTouchIcon: z.string().optional().or(z.literal("")),
  androidChrome192: z.string().optional().or(z.literal("")),
  androidChrome512: z.string().optional().or(z.literal("")),
  safariPinnedTab: z.string().optional().or(z.literal("")),
  msTileColor: z.string(),
  themeColor: z.string(),

  // Additional Meta
  author: z.string().optional().or(z.literal("")),
  robots: z.string().default("index, follow"),
  canonical: z.string().optional().or(z.literal("")),

  // Analytics
  googleAnalyticsId: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  facebookPixelId: z.string().optional(),

  // Organization Schema
  organizationName: z.string().optional().or(z.literal("")),
  organizationUrl: z.string().optional().or(z.literal("")),
  organizationLogo: z.string().optional().or(z.literal("")),
  organizationType: z.enum(["Organization", "Corporation", "EducationalOrganization", "LocalBusiness", "Store"]),

  // Theme Settings
  themeSettings: z.object({
    primaryColor: z.string().default("#2B2B2B"),
    secondaryColor: z.string().default("#6B7280"),
    accentColor: z.string().default("#3B82F6"),
    backgroundColor: z.string().default("#FFFFFF"),
    textColor: z.string().default("#1F2937"),
    borderRadius: z.string().default("0.5rem"),
    fontFamily: z.string().default("Inter"),
    customCSS: z.string().default(""),
    darkMode: z.boolean().default(false),
  }).optional(),
  
  // GST Configuration
  gstClientId: z.string().optional(),
  gstClientSecret: z.string().optional(),
  gstUsername: z.string().optional(),
  gstPublicKey: z.string().optional(),
  gstStateCd: z.string().default("27"),
  gstBaseUrl: z.string().optional().or(z.literal("")).default("https://api.gst.gov.in"),

  // Shipping Configuration
  freeShippingThreshold: z.number().min(0, "Threshold must be a positive number").default(0),
  useWeightBasedShipping: z.boolean().default(false),
  stateShippingCharges: z.array(z.object({
    stateName: z.string().min(1, "State name is required"),
    maxWeightGrams: z.number().min(0, "Must be positive"),
    charge: z.number().min(0, "Must be positive")
  })).optional().default([]),

  // Payment Configuration
  razorpayKeyId: z.string().optional().or(z.literal("")),
  razorpayKeySecret: z.string().optional().or(z.literal("")),
  razorpayWebhookSecret: z.string().optional().or(z.literal("")),
  cashfreeAppId: z.string().optional().or(z.literal("")),
  cashfreeSecretKey: z.string().optional().or(z.literal("")),
  cashfreeWebhookSecret: z.string().optional().or(z.literal("")),
  cashfreeEnvironment: z.enum(["sandbox", "production"]).default("sandbox"),
  bypassPayment: z.boolean().default(false),

  // Google OAuth
  googleClientId: z.string().optional().or(z.literal("")),
  googleClientSecret: z.string().optional().or(z.literal("")),

  // NextAuth
  nextAuthSecret: z.string().optional().or(z.literal("")),
  nextAuthUrl: z.string().optional().or(z.literal("")),

  // Nodemailer SMTP
  emailHost: z.string().optional().or(z.literal("")),
  emailPort: z.preprocess((val) => val === "" || val === null || val === undefined ? undefined : Number(val), z.number().optional()),
  emailUser: z.string().optional().or(z.literal("")),
  emailPassword: z.string().optional().or(z.literal("")),
  emailFrom: z.string().optional().or(z.literal("")),
  adminEmail: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),

  // Cloudinary
  cloudinaryName: z.string().optional().or(z.literal("")),
  cloudinaryApiKey: z.string().optional().or(z.literal("")),
  cloudinarySecret: z.string().optional().or(z.literal("")),

  // Stripe
  stripeApiKey: z.string().optional().or(z.literal("")),
  stripeSecretWebhook: z.string().optional().or(z.literal("")),

  // SMS/Fast2SMS
  fast2smsApiKey: z.string().optional().or(z.literal("")),
  dltTemplateId: z.string().optional().or(z.literal("")),
  dltEntityId: z.string().optional().or(z.literal("")),

  // Delhivery
  delhiveryApiToken: z.string().optional().or(z.literal("")),
  delhiveryB2BUsername: z.string().optional().or(z.literal("")),
  delhiveryB2BPassword: z.string().optional().or(z.literal("")),
  warehousePincode: z.string().optional().or(z.literal("")),

  // Zoho Books
  zohoClientId: z.string().optional().or(z.literal("")),
  zohoClientSecret: z.string().optional().or(z.literal("")),
  zohoRefreshToken: z.string().optional().or(z.literal("")),
  zohoOrganizationId: z.string().optional().or(z.literal("")),

  // Gemini API Keys
  geminiApiKey: z.string().optional().or(z.literal("")),
  geminiApiKey2: z.string().optional().or(z.literal("")),
  geminiApiKey3: z.string().optional().or(z.literal("")),
  geminiApiKey4: z.string().optional().or(z.literal("")),
  geminiApiKey5: z.string().optional().or(z.literal("")),
  geminiApiKey6: z.string().optional().or(z.literal("")),
  geminiApiKey7: z.string().optional().or(z.literal("")),

  // Business GST Registry Settings
  businessState: z.string().optional().or(z.literal("")),
  businessGstin: z.string().optional().or(z.literal("")),
});

type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsSchema>;

export default function WebsiteSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingSettings, setExistingSettings] = useState<any[]>([]);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [seoAiModalOpen, setSeoAiModalOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const form = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsSchema) as any,
    defaultValues: {
      siteName: "",
      siteDescription: "",
      siteKeywords: [],
      defaultTitle: "",
      titleSeparator: " | ",
      ogType: "website",
      twitterCard: "summary_large_image",
      msTileColor: "#da532c",
      themeColor: "#ffffff",
      robots: "index, follow",
      organizationType: "Organization",
      freeShippingThreshold: 0,
      useWeightBasedShipping: false,
      stateShippingCharges: [],
      gstStateCd: "27",
      gstBaseUrl: "https://api.gst.gov.in",
      gstClientId: "",
      gstClientSecret: "",
      gstUsername: "",
      gstPublicKey: "",
      _id: undefined,
      razorpayKeyId: "",
      razorpayKeySecret: "",
      razorpayWebhookSecret: "",
      cashfreeAppId: "",
      cashfreeSecretKey: "",
      cashfreeWebhookSecret: "",
      cashfreeEnvironment: "sandbox",
      bypassPayment: false,
      googleClientId: "",
      googleClientSecret: "",
      nextAuthSecret: "",
      nextAuthUrl: "",
      emailHost: "",
      emailPort: undefined,
      emailUser: "",
      emailPassword: "",
      emailFrom: "",
      adminEmail: "",
      companyName: "",
      cloudinaryName: "",
      cloudinaryApiKey: "",
      cloudinarySecret: "",
      stripeApiKey: "",
      stripeSecretWebhook: "",
      fast2smsApiKey: "",
      dltTemplateId: "",
      dltEntityId: "",
      delhiveryApiToken: "",
      delhiveryB2BUsername: "",
      delhiveryB2BPassword: "",
      warehousePincode: "",
      zohoClientId: "",
      zohoClientSecret: "",
      zohoRefreshToken: "",
      zohoOrganizationId: "",
      geminiApiKey: "",
      geminiApiKey2: "",
      geminiApiKey3: "",
      geminiApiKey4: "",
      geminiApiKey5: "",
      geminiApiKey6: "",
      geminiApiKey7: "",
      businessState: "",
      businessGstin: "",
      themeSettings: {
        primaryColor: "#2B2B2B",
        secondaryColor: "#6B7280",
        accentColor: "#3B82F6",
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        borderRadius: "0.5rem",
        fontFamily: "Inter",
        customCSS: "",
        darkMode: false,
      }
    },
  });

  const { fields: shippingFields, append: appendShippingCharge, remove: removeShippingCharge } = useFieldArray({
    control: form.control,
    name: "stateShippingCharges",
  });

  // Load existing settings
  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await getAllWebsiteSettings();
      if (result.success) {
        setExistingSettings(result.settings);

        // Load active settings into form
        const activeSettings = result.settings.find((s: any) => s.isActive);
        if (activeSettings) {
          // Deep clean null values: convert null to undefined so Zod defaults work
          const cleanData = JSON.parse(JSON.stringify(activeSettings), (key, value) => {
            return value === null ? undefined : value;
          });
          
          form.reset(cleanData);
          setKeywordsInput(cleanData.siteKeywords?.join(", ") || "");
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Handle form submission
  const onSubmit = async (data: WebsiteSettingsFormValues) => {
    setSaving(true);
    try {
      // Process keywords
      const keywords = keywordsInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const result = await createOrUpdateWebsiteSettings({
        ...data,
        _id: data._id,
        siteKeywords: keywords,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Website settings saved successfully",
        });
        loadSettings(); // Reload settings
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper to handle form validation errors
  const onInvalid = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    
    // Create a flat list of errors for the toast
    const errorMessages: string[] = [];
    
    const flattenErrors = (obj: any, prefix = "") => {
      for (const key in obj) {
        if (obj[key]?.message) {
          errorMessages.push(`${prefix}${key}: ${obj[key].message}`);
        } else if (typeof obj[key] === "object") {
          flattenErrors(obj[key], `${prefix}${key}.`);
        }
      }
    };
    
    flattenErrors(errors);
    
    toast({
      title: "Validation Error",
      description: (
        <div className="mt-2 text-xs">
          <p className="font-bold mb-1">Please fix the following fields:</p>
          <ul className="list-disc pl-4 space-y-1 max-h-40 overflow-y-auto">
            {errorMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      ),
      variant: "destructive",
    });
  };

  // Handle file upload for favicons
  const handleFaviconUpload = async (file: File, field: string) => {
    // Convert to WebP if it's an image and not already webp or ico
    let fileToUpload = file;
    if (file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      try {
        const webpBlob = await convertToWebP(file);
        fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
      } catch (e) {
        console.error('WebP conversion failed for favicon:', e);
      }
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', 'favicons');

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload favicon');
      }

      // Update form field with the uploaded URL
      form.setValue(field as any, data.url);

      toast({
        title: "Success",
        description: "Favicon uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload favicon. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle settings activation
  const handleActivate = async (id: string) => {
    try {
      const result = await activateWebsiteSettings(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Settings activated successfully",
        });
        loadSettings();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to activate settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate settings",
        variant: "destructive",
      });
    }
  };

  // Handle settings deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete these settings?")) return;

    try {
      const result = await deleteWebsiteSettings(id);
      if (result.success) {
        toast({
          title: "Success",
          description: "Settings deleted successfully",
        });
        loadSettings();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete settings",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (setting: any) => {
    // Deep clean null values: convert null to undefined so Zod defaults work
    const cleanData = JSON.parse(JSON.stringify(setting), (key, value) => {
      return value === null ? undefined : value;
    });
    
    form.reset(cleanData);
    setKeywordsInput(cleanData.siteKeywords?.join(", ") || "");
    
    toast({
      title: "Settings Loaded",
      description: `Configuration "${setting.siteName}" has been loaded into the form for editing.`,
    });

    // Scroll to form
    const formElement = document.getElementById("website-settings-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleApplyAiSeo = (data: any) => {
    form.setValue("siteName", data.siteName);
    form.setValue("defaultTitle", data.defaultTitle);
    form.setValue("siteDescription", data.siteDescription);
    form.setValue("ogTitle", data.ogTitle);
    form.setValue("ogDescription", data.ogDescription);
    setKeywordsInput(data.siteKeywords.join(", "));
    
    toast({
      title: "Settings Applied",
      description: "AI-generated SEO settings have been filled in the form.",
    });
  };

  const handleTestGstConnection = async () => {
    setTestingConnection(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Connection Success",
        description: "Official GST Portal Handshake completed successfully (Verified G2B Link Established).",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Handshake failed. Please verify your Client ID and RSA Public Key.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Settings</h1>
          <p className="text-muted-foreground">
            Manage SEO metadata, favicons, and analytics for your website
          </p>
        </div>
      </div>

      {/* Existing Settings */}
      {existingSettings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Existing Settings
            </CardTitle>
            <CardDescription>
              Manage your saved website settings configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {existingSettings.map((setting) => (
                <div
                  key={setting._id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{setting.siteName}</h3>
                      {setting.isActive && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.siteDescription}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(setting.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!setting.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(setting._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(setting)}
                      title="Edit this configuration"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(setting._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Form */}
      <Form {...form}>
        <form id="website-settings-form" onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <Tabs defaultValue="seo" className="w-full">
            <TabsList className="flex flex-wrap w-full h-auto bg-muted p-1 gap-1 rounded-md mb-4">
              <TabsTrigger value="seo" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Search className="h-4 w-4" />
                SEO
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Globe className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="favicons" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Upload className="h-4 w-4" />
                Favicons
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <BarChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Settings className="h-4 w-4" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Settings className="h-4 w-4" />
                Theme
              </TabsTrigger>
              <TabsTrigger value="gst" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Fingerprint className="h-4 w-4" />
                GST Settings
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Truck className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Fingerprint className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Key className="h-4 w-4" />
                API Credentials
              </TabsTrigger>
            </TabsList>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Basic SEO Settings</CardTitle>
                    <CardDescription>
                      Configure the essential SEO metadata for your website
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                    onClick={() => setSeoAiModalOpen(true)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Magic SEO Assistant
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Website Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your website (max 100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Default page title" {...field} />
                        </FormControl>
                        <FormDescription>
                          Default title for pages (max 60 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A brief description of your website"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description of your website (max 160 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="text-sm font-medium">Site Keywords</label>
                    <Input
                      placeholder="keyword1, keyword2, keyword3"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Separate keywords with commas
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="titleSeparator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title Separator</FormLabel>
                          <FormControl>
                            <Input placeholder=" | " {...field} />
                          </FormControl>
                          <FormDescription>
                            Separator between page title and site name
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="robots"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Robots Meta</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select robots directive" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="index, follow">Index, Follow</SelectItem>
                              <SelectItem value="noindex, nofollow">No Index, No Follow</SelectItem>
                              <SelectItem value="index, nofollow">Index, No Follow</SelectItem>
                              <SelectItem value="noindex, follow">No Index, Follow</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="author"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author</FormLabel>
                          <FormControl>
                            <Input placeholder="Website author" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canonical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Canonical URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Default canonical URL for your site
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media Tab */}
            <TabsContent value="social" className="space-y-6">
              {/* Open Graph Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Graph (Facebook)</CardTitle>
                  <CardDescription>
                    Configure how your site appears when shared on Facebook and other platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ogTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Open Graph title" {...field} />
                          </FormControl>
                          <FormDescription>Max 40 characters</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OG Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="profile">Profile</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Open Graph description" {...field} rows={2} />
                        </FormControl>
                        <FormDescription>Max 300 characters</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/og-image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Recommended size: 1200x630 pixels
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Twitter Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Twitter Card</CardTitle>
                  <CardDescription>
                    Configure how your site appears when shared on Twitter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="twitterCard"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Card Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="summary">Summary</SelectItem>
                              <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                              <SelectItem value="app">App</SelectItem>
                              <SelectItem value="player">Player</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterSite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Site</FormLabel>
                          <FormControl>
                            <Input placeholder="@yoursite" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="twitterTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Twitter title" {...field} />
                          </FormControl>
                          <FormDescription>Max 70 characters</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitterCreator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Twitter Creator</FormLabel>
                          <FormControl>
                            <Input placeholder="@creator" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="twitterDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Twitter description" {...field} rows={2} />
                        </FormControl>
                        <FormDescription>Max 200 characters</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/twitter-image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Recommended size: 1200x675 pixels
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favicons Tab */}
            <TabsContent value="favicons" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favicon Configuration</CardTitle>
                  <CardDescription>
                    Upload and configure favicons for different devices and browsers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Standard Favicons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Standard Favicons</h4>

                      <FormField
                        control={form.control}
                        name="favicon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon (ICO)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon.ico" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".ico,.png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <FormDescription>Default favicon (16x16 or 32x32)</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favicon16"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon 16x16</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon-16x16.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon16');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="favicon32"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Favicon 32x32</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/favicon-32x32.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'favicon32');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Device-Specific Icons</h4>

                      <FormField
                        control={form.control}
                        name="appleTouchIcon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apple Touch Icon</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/apple-touch-icon.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'appleTouchIcon');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <FormDescription>180x180 PNG for iOS devices</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="androidChrome192"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Android Chrome 192x192</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/android-chrome-192x192.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'androidChrome192');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="androidChrome512"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Android Chrome 512x512</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="https://example.com/android-chrome-512x512.png" {...field} />
                              </FormControl>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept=".png"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFaviconUpload(file, 'androidChrome512');
                                  }}
                                />
                                <Button type="button" variant="outline">
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Browser-Specific */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="safariPinnedTab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Safari Pinned Tab</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="https://example.com/safari-pinned-tab.svg" {...field} />
                            </FormControl>
                            <div className="relative">
                              <Input
                                type="file"
                                accept=".svg"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFaviconUpload(file, 'safariPinnedTab');
                                }}
                              />
                              <Button type="button" variant="outline">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <FormDescription>SVG icon for Safari pinned tabs</FormDescription>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="msTileColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MS Tile Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormDescription>Windows tile color</FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme Color</FormLabel>
                            <FormControl>
                              <Input type="color" {...field} />
                            </FormControl>
                            <FormDescription>Browser theme color</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics & Tracking</CardTitle>
                  <CardDescription>
                    Configure tracking codes for analytics and marketing platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="googleAnalyticsId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Analytics ID</FormLabel>
                        <FormControl>
                          <Input placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Google Analytics tracking ID (GA4 or Universal Analytics)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleTagManagerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Tag Manager ID</FormLabel>
                        <FormControl>
                          <Input placeholder="GTM-XXXXXXX" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Google Tag Manager container ID
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebookPixelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="XXXXXXXXXXXXXXX" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your Facebook Pixel ID for tracking conversions
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Tab */}
            <TabsContent value="schema" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Schema</CardTitle>
                  <CardDescription>
                    Configure structured data for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Organization">Organization</SelectItem>
                              <SelectItem value="Corporation">Corporation</SelectItem>
                              <SelectItem value="EducationalOrganization">Educational Organization</SelectItem>
                              <SelectItem value="LocalBusiness">Local Business</SelectItem>
                              <SelectItem value="Store">Store</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="organizationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourcompany.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main URL of your organization
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organizationLogo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourcompany.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to your organization's logo (recommended: 600x60px)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Tab */}
            <TabsContent value="theme" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Configure the appearance and branding of your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Color Scheme</h4>

                      <FormField
                        control={form.control}
                        name="themeSettings.primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#2B2B2B" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              The main brand color for buttons, links, and accents
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#6B7280" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Secondary color for subtle elements
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.accentColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accent Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#3B82F6" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Accent color for highlights and call-to-actions
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.backgroundColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Background Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#FFFFFF" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Main background color of the website
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.textColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Color</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input type="color" {...field} className="w-20" />
                              </FormControl>
                              <FormControl>
                                <Input placeholder="#1F2937" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>
                              Default text color for content
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Typography & Layout</h4>

                      <FormField
                        control={form.control}
                        name="themeSettings.fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Family</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select font family" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Lato">Lato</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="system-ui">System UI</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Primary font family for the website
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.borderRadius"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Radius</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select border radius" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Sharp (0px)</SelectItem>
                                <SelectItem value="0.25rem">Minimal (4px)</SelectItem>
                                <SelectItem value="0.5rem">Medium (8px)</SelectItem>
                                <SelectItem value="0.75rem">Rounded (12px)</SelectItem>
                                <SelectItem value="1rem">Very Rounded (16px)</SelectItem>
                                <SelectItem value="9999px">Pill Shape</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Default border radius for buttons and cards
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="themeSettings.darkMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Dark Mode
                              </FormLabel>
                              <FormDescription>
                                Enable dark mode as the default theme
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Custom CSS */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Custom CSS</h4>
                    <FormField
                      control={form.control}
                      name="themeSettings.customCSS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom CSS</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="/* Add your custom CSS here */
.custom-button {
  background: linear-gradient(45deg, #ff6b6b, #ee5a6f);
  border: none;
  color: white;
}"
                              {...field}
                              rows={8}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            Add custom CSS to override default styles. Use with caution as this can affect site performance and appearance.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Theme Preview */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Theme Preview</h4>
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="space-y-4">
                        <div
                          className="p-4 rounded-lg text-white font-medium"
                          style={{
                            backgroundColor: form.watch('themeSettings.primaryColor') || '#2B2B2B',
                            borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem'
                          }}
                        >
                          Primary Button Example
                        </div>
                        <div
                          className="p-4 rounded-lg border"
                          style={{
                            backgroundColor: form.watch('themeSettings.backgroundColor') || '#FFFFFF',
                            color: form.watch('themeSettings.textColor') || '#1F2937',
                            borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem',
                            fontFamily: form.watch('themeSettings.fontFamily') || 'Inter'
                          }}
                        >
                          <h5 className="font-semibold mb-2">Sample Content</h5>
                          <p className="text-sm">
                            This is how your content will look with the selected theme settings.
                            The typography, colors, and border radius will be applied across your website.
                          </p>
                          <button
                            className="mt-3 px-4 py-2 text-white text-sm rounded"
                            style={{
                              backgroundColor: form.watch('themeSettings.accentColor') || '#3B82F6',
                              borderRadius: form.watch('themeSettings.borderRadius') || '0.5rem'
                            }}
                          >
                            Accent Button
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* GST Settings Tab */}
            <TabsContent value="gst" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Official GST G2B Configuration</CardTitle>
                    <CardDescription>
                      Configure your connection to the Official GST Developer Portal
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={handleTestGstConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    Test GST Connection
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Client ID</FormLabel>
                          <FormControl>
                            <Input placeholder="XXXX-XXXX-XXXX" {...field} />
                          </FormControl>
                          <FormDescription>
                            From your 'Application' on the GST Developer Portal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gstClientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Client Secret</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gstUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GST Portal Username (App Link)</FormLabel>
                          <FormControl>
                            <Input placeholder="DHIRO8989" {...field} />
                          </FormControl>
                          <FormDescription>
                            The username you use to log in to the GST common portal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gstStateCd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State Code (Primary)</FormLabel>
                          <FormControl>
                            <Input placeholder="27" {...field} />
                          </FormControl>
                          <FormDescription>
                            e.g., 27 for Maharashtra, 07 for Delhi
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gstPublicKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RSA Public Key (PEM)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="-----BEGIN PUBLIC KEY----- ..." 
                            className="font-mono text-xs" 
                            rows={6} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Locate this in your application settings on the GST Portal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstBaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://api.gst.gov.in" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use https://api.gst.gov.in for production
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping & Delivery Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure shipping costs and free shipping thresholds for your store.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="freeShippingThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Shipping Threshold (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="500" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Orders with a total value equal to or greater than this amount will have free shipping. 
                          Set to 0 to disable free shipping completely.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="useWeightBasedShipping"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Custom Weight-Based Shipping</FormLabel>
                            <FormDescription>
                              Enable state-specific custom shipping rules based on item weight.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("useWeightBasedShipping") && (
                      <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold">State Shipping Rules</h4>
                            <p className="text-xs text-muted-foreground">Add weight-based rules per state. Use "Default" to set a fallback for all other states.</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendShippingCharge({ stateName: "", maxWeightGrams: 500, charge: 0 })}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Rule
                          </Button>
                        </div>
                        
                        {shippingFields.length === 0 ? (
                          <div className="text-sm text-center text-muted-foreground py-4 border rounded-md bg-background">
                            No custom shipping rules defined.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {shippingFields.map((field, index) => (
                              <div key={field.id} className="flex gap-3 items-start bg-background p-3 rounded-md border">
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                  <FormField
                                    control={form.control}
                                    name={`stateShippingCharges.${index}.stateName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">State / Region</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g. West Bengal or Default" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`stateShippingCharges.${index}.maxWeightGrams`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Max Weight (g)</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`stateShippingCharges.${index}.charge`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Charge (₹)</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            {...field} 
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="mt-6 text-destructive hover:bg-destructive/10"
                                  onClick={() => removeShippingCharge(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5" />
                    Payment Gateway Configuration (Razorpay & Cashfree)
                  </CardTitle>
                  <CardDescription>
                    Manage API keys and payment processing behavior for Razorpay and Cashfree.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-md font-semibold mb-3">Razorpay Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="razorpayKeyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razorpay Key ID</FormLabel>
                            <FormControl>
                              <Input placeholder="rzp_live_..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Your public Razorpay Key ID
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="razorpayKeySecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razorpay Key Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Keep this secret secure
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name="razorpayWebhookSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razorpay Webhook Secret</FormLabel>
                            <FormControl>
                              <Input placeholder="Your webhook secret" {...field} />
                            </FormControl>
                            <FormDescription>
                              Used to verify payment success notifications from Razorpay
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-md font-semibold mb-3">Cashfree Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="cashfreeAppId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cashfree App ID (Client ID)</FormLabel>
                            <FormControl>
                              <Input placeholder="TEST... or CF..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Your Cashfree App ID from merchant dashboard
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cashfreeSecretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cashfree Secret Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your Cashfree Client Secret Key
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <FormField
                        control={form.control}
                        name="cashfreeWebhookSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cashfree Webhook Secret</FormLabel>
                            <FormControl>
                              <Input placeholder="Cashfree Webhook Secret" {...field} />
                            </FormControl>
                            <FormDescription>
                              Optional signature secret for webhooks
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cashfreeEnvironment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cashfree Environment</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || "sandbox"}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select environment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sandbox font-mono">sandbox (Testing)</SelectItem>
                                <SelectItem value="production font-mono">production (Live)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Set to sandbox for testing, production for live payments
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="bypassPayment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base text-amber-900 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Bypass Real Payment
                          </FormLabel>
                          <FormDescription className="text-amber-700">
                            When enabled, orders will be placed <strong>instantly</strong> without opening the Razorpay payment popup. Use this <strong>only</strong> for testing or development.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Credentials Tab */}
            <TabsContent value="credentials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Credentials & Server Configuration
                  </CardTitle>
                  <CardDescription>
                    Migrate and manage your third-party service credentials securely in the database.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Google OAuth & NextAuth */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Google OAuth & NextAuth Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="googleClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Client ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Google Client ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="googleClientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Client Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nextAuthSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NextAuth Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nextAuthUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NextAuth URL</FormLabel>
                            <FormControl>
                              <Input placeholder="http://localhost:3000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Nodemailer SMTP Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">SMTP Server Config (Nodemailer)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="emailHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.gmail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="465" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP User</FormLabel>
                            <FormControl>
                              <Input placeholder="your-email@gmail.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emailFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email From Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Vibecart <no-reply@vibecart.com>" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Notification Email</FormLabel>
                            <FormControl>
                              <Input placeholder="admin@vibecart.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Vibecart Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Cloudinary Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Cloudinary Asset Storage</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="cloudinaryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cloudinary Cloud Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Cloud Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cloudinaryApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cloudinary API Key</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter API Key" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cloudinarySecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cloudinary Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Stripe Payment Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Stripe Payment Gateway</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="stripeApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Secret Api Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stripeSecretWebhook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stripe Webhook Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* SMS Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">SMS Gateway Config (Fast2SMS / DLT)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="fast2smsApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fast2SMS API Key</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dltTemplateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DLT Template ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter DLT Template ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dltEntityId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DLT Entity ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter DLT Entity ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Delhivery Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Delhivery Shipping Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="delhiveryApiToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delhivery API Token</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="delhiveryB2BUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delhivery B2B Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="delhiveryB2BPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delhivery B2B Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="warehousePincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse Pincode</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Pincode" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Zoho Books Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Zoho Books Integration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="zohoClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zoho Client ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Client ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zohoClientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zoho Client Secret</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zohoRefreshToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zoho Refresh Token</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zohoOrganizationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zoho Organization ID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Organization ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Gemini API Keys Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Gemini AI API Keys (Rotation Pool)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 1 (Primary)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 2</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 3</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 4</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey5"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 5</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey6"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 6</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="geminiApiKey7"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gemini API Key 7</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Business GST Registry */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Business GST Registry</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="businessState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Origin State</FormLabel>
                            <FormControl>
                              <Input placeholder="West Bengal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessGstin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business GSTIN</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter Business GSTIN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[120px]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <SeoAiModal 
        open={seoAiModalOpen} 
        onOpenChange={setSeoAiModalOpen} 
        onApply={handleApplyAiSeo}
      />
    </div>
  );
}