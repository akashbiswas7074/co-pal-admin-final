"use client";

import React, { useState, useEffect } from "react";
import { 
  TextInput, 
  Button, 
  Group, 
  Card, 
  Switch, 
  Title, 
  Text, 
  Stack, 
  Modal, 
  Textarea,
  ActionIcon,
  Tooltip,
  Box,
  SimpleGrid,
  Accordion,
  Loader,
  Divider,
  Badge
} from "@mantine/core";
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  Layout, 
  Settings, 
  Globe, 
  RefreshCcw,
  Wand2
} from "lucide-react";
import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateCustomPageContent } from "@/lib/ai-service";

interface CustomPageFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<any>;
  loading?: boolean;
}

export function CustomPageForm({ initialData, onSubmit, loading = false }: CustomPageFormProps) {
  const [aiModalOpened, setAiModalOpened] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const form = useForm({
    initialValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      content: initialData?.content || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      isActive: initialData?.isActive ?? true,
    },
    validate: {
      title: (val) => (val.length < 2 ? "Title must be at least 2 characters" : null),
      slug: (val) => (val.length < 2 ? "Slug must be at least 2 characters" : null),
      content: (val) => (!val || val.length < 10 ? "Content is required" : null),
    },
  });

  // Auto-generate slug from title if it's empty or hasn't been manually edited
  useEffect(() => {
    if (!initialData && form.values.title && !form.isDirty("slug")) {
      const generatedSlug = form.values.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setFieldValue("slug", generatedSlug);
    }
  }, [form.values.title, initialData]);

  const handleAiGenerate = async () => {
    if (!form.values.title) {
      toast.error("Please enter a page title first");
      return;
    }
    
    setIsGenerating(true);
    try {
      const generatedContent = await generateCustomPageContent(form.values.title, aiPrompt);
      if (generatedContent) {
        form.setFieldValue("content", generatedContent);
        setAiModalOpened(false);
        setAiPrompt("");
        toast.success("AI Content Generated!");
      } else {
        toast.error("Failed to generate content. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <Title order={3}>{initialData ? `Edit "${initialData.title}"` : "Create Custom Page"}</Title>
        </Group>
        
        <Group>
          <Button 
            variant="light" 
            color="violet" 
            leftSection={<Sparkles size={18} />}
            onClick={() => setAiModalOpened(true)}
            className="border-violet-200"
          >
            Magic AI Writer
          </Button>
          <Button 
            color="blue" 
            leftSection={<Save size={18} />} 
            onClick={() => form.onSubmit(onSubmit)()}
            loading={loading}
          >
            {initialData ? "Save Changes" : "Save Page"}
          </Button>
        </Group>
      </Group>

      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {/* Left Column: Editor Content */}
            <Box className="md:col-span-2 space-y-6">
              <Card withBorder radius="md" padding="xl" className="shadow-sm border-gray-200 min-h-[600px]">
                <Stack gap="lg">
                  <TextInput
                    label="Page Title"
                    placeholder="e.g., About Our Story"
                    description="The main title displayed on your new page."
                    size="md"
                    className="font-semibold"
                    required
                    {...form.getInputProps("title")}
                  />
                  
                  <Box>
                    <Text fw={500} size="sm" mb={4}>Page Content <Text span color="red">*</Text></Text>
                    <RichTextEditor
                      value={form.values.content}
                      onChange={(val) => form.setFieldValue("content", val)}
                      height={500}
                    />
                    {form.errors.content && (
                      <Text color="red" size="xs" mt={4}>{form.errors.content}</Text>
                    )}
                  </Box>
                </Stack>
              </Card>
            </Box>

            {/* Right Column: Settings & SEO */}
            <Box className="space-y-6">
              <Card withBorder radius="md" padding="xl" className="shadow-sm border-gray-200">
                <Stack gap="md">
                  <Group gap={8}>
                    <Settings size={18} className="text-gray-500" />
                    <Text fw={700}>Page Settings</Text>
                  </Group>
                  <Divider />
                  
                  <TextInput
                    label="URL Slug"
                    placeholder="about-us"
                    description={`URL: /page/${form.values.slug || "..."}`}
                    required
                    {...form.getInputProps("slug")}
                  />

                  <Switch
                    label="Published (Active)"
                    description="If disabled, this page won't be visible to users."
                    checked={form.values.isActive}
                    onChange={(event) => form.setFieldValue("isActive", event.currentTarget.checked)}
                    mt="xs"
                  />
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="xl" className="shadow-sm border-gray-200">
                <Stack gap="md">
                  <Group gap={8}>
                    <Globe size={18} className="text-gray-500" />
                    <Text fw={700}>SEO Configuration</Text>
                  </Group>
                  <Divider />
                  
                  <TextInput
                    label="Meta Title"
                    placeholder="Authoritative Page Title"
                    description="Appears in browser tabs and search results."
                    {...form.getInputProps("metaTitle")}
                  />

                  <Textarea
                    label="Meta Description"
                    placeholder="A brief summary of this page..."
                    description="Used by search engines for sneak-peek text."
                    rows={3}
                    {...form.getInputProps("metaDescription")}
                  />
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg" className="bg-blue-50/30 border-blue-100 italic">
                <Group gap="xs" wrap="nowrap">
                  <Layout size={16} className="text-blue-500 flex-shrink-0" />
                  <Text size="xs" color="blue">
                    Pro Tip: Use the Preview tab in the editor to see how your content looks on the live website.
                  </Text>
                </Group>
              </Card>
            </Box>
          </SimpleGrid>
        </Stack>
      </form>

      {/* AI Assistant Modal */}
      <Modal
        opened={aiModalOpened}
        onClose={() => !isGenerating && setAiModalOpened(false)}
        title={
          <Group gap="xs">
            <Sparkles size={20} className="text-violet-500" />
            <Text fw={700}>AI Magic Page Writer</Text>
          </Group>
        }
        centered
        radius="lg"
        size="lg"
        padding="xl"
      >
        <Stack gap="lg">
          <div>
            <Text size="sm" fw={600} mb={4}>Target Page:</Text>
            <Badge size="lg" color="violet" variant="dot">{form.values.title || "Untitled Page"}</Badge>
          </div>
          
          <Textarea
            label="Additional Context (Optional)"
            placeholder="Tell AI about your mission, values, or specific points to include. For example: 'Make it sound eco-friendly' or 'Add a section about our global team'."
            description="The more context you give, the better the result!"
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />

          <Box className="bg-gray-50 p-4 rounded-md border border-dashed border-gray-300">
            <Text size="xs" c="dimmed">
              <Sparkles size={12} className="inline mr-1" />
              AI will generate a complete HTML structure including headlines, paragraphs, and bullet points optimized for your theme.
            </Text>
          </Box>

          <Button 
            fullWidth 
            size="md" 
            color="violet"
            leftSection={<Wand2 size={18} />}
            loading={isGenerating}
            onClick={handleAiGenerate}
            disabled={!form.values.title}
          >
            Generate Content Now
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
