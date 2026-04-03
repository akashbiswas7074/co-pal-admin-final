"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Button,
  Group,
  Text,
  TextInput,
  NumberInput,
  Select,
  Card,
  SimpleGrid,
  Stack,
  Title,
  Badge,
  ActionIcon,
  Box,
  ColorInput,
  Modal,
  Divider,
  Loader,
  Tabs,
  Avatar,
  Tooltip,
  Switch,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconEdit, IconTrash, IconUpload, IconPackage, 
  IconSettings, IconPlus, IconPhoto, IconX,
  IconCheck, IconAlertTriangle
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useRouter } from "next/navigation";
import {
  createSample,
  updateSample,
  deleteSample,
} from "@/lib/database/actions/sample.actions";
import {
  getProducts,
  updateSampleSettings,
  uploadSampleBanner,
} from "@/lib/database/actions/admin/products/samples.actions";
import { notifications } from "@mantine/notifications";

/* ───────────────────────────── Types ─────────────────────────────── */
interface Sample {
  _id: string;
  name: string;
  price: number;
  status: "available" | "unavailable";
  discount: number;
  image?: string;
  publicId?: string;
  productId?: string;
  variant?: string;
  value?: number;
  unit?: string;
}

interface SampleSettings {
  bannerImage: string;
  title: string;
  subtitle: string;
  titleColor: string;
  subtitleColor: string;
}

interface ProductSample {
  productId: string;
  name: string;
  sampleName: string;
  price: number;
  image: string;
  samples?: Array<{ value: string; unit: string; price: string }>;
}

interface SamplesClientProps {
  initialData: Sample[];
  initialSettings: SampleSettings | null;
}

/* ───────────────────────────── Component ─────────────────────────── */
export default function SamplesClient({ initialData, initialSettings }: SamplesClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --- state --- */
  const [samples, setSamples] = useState<Sample[]>(initialData.filter(Boolean));
  const [productSamples, setProductSamples] = useState<ProductSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importPrices, setImportPrices] = useState<Record<string, Array<{ price: number, enabled: boolean, value: number, unit: string }>>>({});

  /* --- edit modal --- */
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    image: string;
    publicId: string;
    productId: string;
    status: "available" | "unavailable";
  }>({ 
    name: "", 
    status: "available", 
    image: "",
    publicId: "",
    productId: "",
  });

  const [editFormVariants, setEditFormVariants] = useState<Array<{
    value: number;
    unit: string;
    price: number;
    discount: number;
    id?: string;
  }>>([{ value: 5, unit: "ml", price: 60, discount: 0, id: Math.random().toString() }]);

  /* --- settings --- */
  const defaultSettings: SampleSettings = {
    bannerImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1920",
    title: "Sample Packs",
    subtitle: "Curate your own sample pack.",
    titleColor: "#ffffff",
    subtitleColor: "#ea580c",
  };

  const [settings, setSettings] = useState<SampleSettings>(() => {
    if (!initialSettings) return defaultSettings;
    return {
      bannerImage: initialSettings.bannerImage || defaultSettings.bannerImage,
      title: initialSettings.title || defaultSettings.title,
      subtitle: initialSettings.subtitle || defaultSettings.subtitle,
      titleColor: initialSettings.titleColor || defaultSettings.titleColor,
      subtitleColor: initialSettings.subtitleColor || defaultSettings.subtitleColor,
    };
  });

  /* ── Fetch available products for import ── */
  useEffect(() => {
    const fetchProductSamples = async () => {
      setFetchingProducts(true);
      try {
        const res = await getProducts();
        const filteredRes = res.filter(
          (ps: ProductSample) => !samples.some((s) => s.productId === ps.productId)
        );
        setProductSamples(filteredRes);

        // Initialize import prices for each product's predefined samples
        const initialPrices: typeof importPrices = {};
        filteredRes.forEach((ps: ProductSample) => {
          if (ps.samples && ps.samples.length > 0) {
            initialPrices[ps.productId] = ps.samples.map(s => ({
              price: Number(s.price) || 60,
              enabled: true,
              value: Number(s.value) || 5,
              unit: s.unit || "ml"
            }));
          } else {
            // Default blank sample if none defined
            initialPrices[ps.productId] = [{ price: 60, enabled: true, value: 5, unit: "ml" }];
          }
        });
        setImportPrices(initialPrices);
      } catch (error) {
        console.error(error);
      } finally {
        setFetchingProducts(false);
      }
    };
    fetchProductSamples();
  }, [samples]);

  /* ── Settings handlers ── */
  const handleUpdateSettings = async () => {
    setUpdatingSettings(true);
    try {
      await updateSampleSettings(settings);
      notifications.show({ title: "Saved", message: "Page settings updated successfully", color: "green" });
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Failed to update settings", color: "red" });
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await uploadSampleBanner(reader.result as string);
        const updatedSettings = { ...settings, bannerImage: res.url };
        setSettings(updatedSettings);
        await updateSampleSettings(updatedSettings);
        notifications.show({ title: "Uploaded", message: "Banner image saved", color: "green" });
        router.refresh();
      } catch {
        notifications.show({ title: "Error", message: "Failed to upload image", color: "red" });
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
  };

  const handleOpenEdit = (sample: Sample) => {
    setEditingSample(sample);
    setEditForm({
      name: sample.name,
      status: sample.status,
      image: sample.image || "",
      publicId: sample.publicId || "",
      productId: sample.productId || "",
    });
    setEditFormVariants([{
      value: sample.value || 5,
      unit: sample.unit || "ml",
      price: sample.price || 60,
      discount: sample.discount || 0,
      id: "editing"
    }]);
    openEdit();
  };

  const handleOpenCreate = () => {
    setEditingSample(null);
    setEditForm({
      name: "",
      status: "available",
      image: "",
      publicId: "",
      productId: "",
    });
    setEditFormVariants([{ value: 5, unit: "ml", price: 60, discount: 0, id: Math.random().toString() }]);
    openEdit();
  };

  const addVariantField = () => {
    setEditFormVariants(prev => [...prev, { value: 5, unit: "ml", price: 60, discount: 0, id: Math.random().toString() }]);
  };

  const removeVariantField = (id: string) => {
    if (editFormVariants.length > 1) {
      setEditFormVariants(prev => prev.filter(v => v.id !== id));
    }
  };

  const updateVariantField = (id: string, field: string, val: any) => {
    setEditFormVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: val } : v));
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      if (editingSample) {
        // Single update
        const v = editFormVariants[0];
        const updatedData = {
          ...editForm,
          value: Number(v.value),
          unit: v.unit,
          price: Number(v.price),
          discount: Number(v.discount),
          variant: `${v.value}${v.unit}`
        };
        const res = await updateSample(editingSample._id, updatedData);
        if (res && res._id) {
          setSamples((prev) => prev.map((s) => (s._id === editingSample._id ? { ...s, ...res } : s)));
          notifications.show({ title: "Updated", message: `"${res.name}" updated successfully`, color: "green" });
        }
      } else {
        // Bulk creation
        const results = await Promise.all(
          editFormVariants.map(v => 
            createSample({
              ...editForm,
              value: Number(v.value),
              unit: v.unit,
              price: Number(v.price),
              discount: Number(v.discount),
              variant: `${v.value}${v.unit}`
            })
          )
        );
        
        const validResults = results.filter(r => r && r._id);
        if (validResults.length > 0) {
          setSamples((prev) => [...validResults, ...prev]);
          notifications.show({ title: "Created", message: `${validResults.length} variants created successfully`, color: "green" });
        }
      }
      closeEdit();
      router.refresh();
    } catch {
      notifications.show({ title: "Error", message: "Failed to save sample(s)", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle availability inline ── */
  const handleToggleStatus = async (sample: Sample) => {
    const newStatus = sample.status === "available" ? "unavailable" : "available";
    try {
      const res = await updateSample(sample._id, { ...sample, status: newStatus });
      if (res && res._id) {
        setSamples((prev) => prev.map((s) => (s._id === sample._id ? { ...s, status: newStatus } : s)));
      }
    } catch {
      notifications.show({ title: "Error", message: "Failed to toggle status", color: "red" });
    }
  };

  /* ── Delete ── */
  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Sample",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>"{name}"</strong>? This cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteSample(id);
          setSamples((prev) => prev.filter((s) => s._id !== id));
          router.refresh();
          notifications.show({ title: "Deleted", message: `"${name}" removed`, color: "red" });
        } catch {
          notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
        }
      },
    });
  };

  /* ── Import product as sample ── */
  const handleImport = async (ps: ProductSample) => {
    const configList = importPrices[ps.productId];
    if (!configList || configList.every(c => !c.enabled)) {
      notifications.show({ title: "Select a variant", message: "Please enable at least one variant to import", color: "orange" });
      return;
    }

    setImportingId(ps.productId);
    try {
      const results: any[] = [];
      const productSamplesList = ps.samples && ps.samples.length > 0 
        ? ps.samples 
        : [{ value: "5", unit: "ml", price: "60" }]; // Fallback if no samples defined
      
      configList.forEach((config) => {
        if (config.enabled) {
          results.push(createSample({
            name: `${ps.name} - ${config.value}${config.unit}`,
            price: config.price,
            status: "available",
            discount: 0,
            image: ps.image || "",
            productId: ps.productId,
            variant: `${config.value}${config.unit}`,
            value: Number(config.value),
            unit: config.unit,
            publicId: "",
          }));
        }
      });

      const createdSamples = await Promise.all(results);
      const validSamples = createdSamples.filter(s => s && s._id);
      
      if (validSamples.length > 0) {
        setSamples((prev) => [...validSamples, ...prev]);
        notifications.show({ 
          title: "Imported", 
          message: `"${ps.name}" added as sample (${validSamples.length} variants)`, 
          color: "teal" 
        });
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      notifications.show({ title: "Error", message: "Failed to import product", color: "red" });
    } finally {
      setImportingId(null);
    }
  };

  /* ──────────────────────────── Render ─────────────────────────────── */
  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Title order={2} fw={700}>Sample Packs</Title>
          <Text size="sm" c="dimmed">Manage sample products and configure the Sample Packs page</Text>
        </Stack>
        <Badge size="lg" variant="light" color="violet">
          {samples.filter(Boolean).length} Sample{samples.filter(Boolean).length !== 1 ? "s" : ""} Active
        </Badge>
      </Group>

      <Tabs defaultValue="samples" variant="outline" id="samples-management-tabs">
        <Tabs.List>
          <Tabs.Tab value="samples" leftSection={<IconPackage size={16} />}>
            Managed Samples
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconPlus size={16} />}>
            Import Products ({productSamples.length})
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Page Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="samples" pt="md">
          <Group justify="flex-end" mb="md">
            <Button 
              leftSection={<IconPlus size={16} />} 
              variant="outline" 
              color="violet"
              onClick={handleOpenCreate}
            >
              Create New Sample
            </Button>
          </Group>
          {samples.filter(Boolean).length === 0 ? (
            <Paper withBorder p="xl" radius="md" style={{ textAlign: "center" }}>
              <ThemeIcon size={56} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                <IconPackage size={28} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb={4}>No samples yet</Text>
              <Text size="sm" c="dimmed">Import products from the "Import Products" tab to get started.</Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {samples.filter(Boolean).map((sample) => (
                <Card key={sample._id} withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
                  {/* Image */}
                  <Box pos="relative" h={160} bg="gray.1">
                  {sample.image?.startsWith('http') ? (
                      <Image src={sample.image} alt={sample.name} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <Group justify="center" align="center" h="100%">
                        <ThemeIcon size={48} variant="light" color="gray" radius="xl">
                          <IconPhoto size={24} />
                        </ThemeIcon>
                      </Group>
                    )}
                    {/* Status badge overlay */}
                    <Box pos="absolute" top={8} left={8}>
                      <Badge
                        size="sm"
                        color={sample.status === "available" ? "teal" : "red"}
                        variant="filled"
                      >
                        {sample.status}
                      </Badge>
                    </Box>
                  </Box>

                  {/* Content */}
                  <Stack gap={6} p="md">
                    <Group justify="space-between" align="flex-start">
                      <Text fw={700} size="sm" lineClamp={2} style={{ flex: 1 }}>{sample.name}</Text>
                      {(sample.value || sample.unit) && (
                        <Badge size="xs" variant="outline" color="violet">
                          {sample.value}{sample.unit}
                        </Badge>
                      )}
                      {sample.variant && !sample.value && (
                        <Badge size="xs" variant="outline" color="gray">
                          {sample.variant}
                        </Badge>
                      )}
                    </Group>
                    <Group justify="space-between" align="center">
                      <Stack gap={0}>
                        <Text size="sm" fw={600} c="dark">₹{sample.price}</Text>
                        {sample.discount > 0 && (
                          <Text size="xs" c="green">{sample.discount}% off</Text>
                        )}
                      </Stack>
                      <Switch
                        size="sm"
                        checked={sample.status === "available"}
                        onChange={() => handleToggleStatus(sample)}
                        color="teal"
                        label={<Text size="xs" c="dimmed">Available</Text>}
                      />
                    </Group>

                    <Divider />

                    <Group gap={6} justify="flex-end">
                      <Tooltip label="Edit sample">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="md"
                          onClick={() => handleOpenEdit(sample)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete sample">
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="md"
                          onClick={() => handleDelete(sample._id, sample.name)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>

        {/* ══════ TAB 2: Import Products ══════ */}
        <Tabs.Panel value="import" pt="md">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              These are products from your catalog not yet added as samples. Click "Import" to add them.
            </Text>
            {fetchingProducts && (
              <Group justify="center" py="xl">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Loading products...</Text>
              </Group>
            )}
            {!fetchingProducts && productSamples.length === 0 && (
              <Paper withBorder p="xl" radius="md" style={{ textAlign: "center" }}>
                <ThemeIcon size={48} variant="light" color="teal" mx="auto" mb="sm">
                  <IconCheck size={24} />
                </ThemeIcon>
                <Text fw={600}>All products imported!</Text>
                <Text size="sm" c="dimmed">Every product in your catalog has been added as a sample.</Text>
              </Paper>
            )}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {productSamples.map((ps, idx) => (
                <Card key={`${ps.productId}-${idx}`} withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
                  <Box pos="relative" h={120} bg="gray.1">
                    {ps.image?.startsWith('http') ? (
                      <Image src={ps.image} alt={ps.name} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <Group justify="center" align="center" h="100%">
                        <Avatar size={40} color="gray" radius="xl">
                          {ps.name.charAt(0)}
                        </Avatar>
                      </Group>
                    )}
                  </Box>
                  <Stack gap={10} p="sm">
                    <Text fw={600} size="sm" lineClamp={1}>{ps.name}</Text>
                    
                    <Stack gap={8}>
                      {(importPrices[ps.productId] || []).map((config, idx) => (
                        <Group key={idx} justify="space-between" align="center" wrap="nowrap">
                          <Switch 
                            size="xs" 
                            checked={config.enabled} 
                            onChange={(e) => {
                              const newPrices = [...(importPrices[ps.productId] || [])];
                              newPrices[idx] = { ...newPrices[idx], enabled: e.currentTarget.checked };
                              setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                            }}
                          />
                          <Group gap={4} style={{ flex: 1 }} wrap="nowrap">
                            <NumberInput
                              size="xs"
                              w={50}
                              placeholder="Val"
                              value={config.value}
                              onChange={(val) => {
                                const newPrices = [...(importPrices[ps.productId] || [])];
                                newPrices[idx] = { ...newPrices[idx], value: Number(val) || 0 };
                                setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                              }}
                              disabled={!config.enabled}
                            />
                            <Select
                              size="xs"
                              w={65}
                              data={["ml", "g", "pcs", "oz", "unit"]}
                              value={config.unit}
                              onChange={(val) => {
                                const newPrices = [...(importPrices[ps.productId] || [])];
                                newPrices[idx] = { ...newPrices[idx], unit: val || "ml" };
                                setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                              }}
                              disabled={!config.enabled}
                              searchable
                            />
                          </Group>
                          <NumberInput
                            size="xs"
                            w={65}
                            placeholder="Price"
                            value={config.price}
                            onChange={(val) => {
                              const newPrices = [...(importPrices[ps.productId] || [])];
                              newPrices[idx] = { ...newPrices[idx], price: Number(val) || 0 };
                              setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                            }}
                            disabled={!config.enabled}
                          />
                          <ActionIcon 
                            size="xs" 
                            color="red" 
                            variant="light"
                            onClick={() => {
                              const newPrices = [...(importPrices[ps.productId] || [])];
                              newPrices.splice(idx, 1);
                              setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                            }}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        </Group>
                      ))}
                      <Button 
                        size="compact-xs" 
                        variant="subtle" 
                        leftSection={<IconPlus size={10} />}
                        onClick={() => {
                          const newPrices = [...(importPrices[ps.productId] || [])];
                          newPrices.push({ price: 60, enabled: true, value: 5, unit: "ml" });
                          setImportPrices(prev => ({ ...prev, [ps.productId]: newPrices }));
                        }}
                      >
                        Add Variant
                      </Button>
                    </Stack>

                    <Button
                      size="xs"
                      variant="filled"
                      color="teal"
                      leftSection={<IconPlus size={14} />}
                      loading={importingId === ps.productId}
                      onClick={() => handleImport(ps)}
                      fullWidth
                      mt={4}
                    >
                      Import Selected
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>

        {/* ══════ TAB 3: Page Settings ══════ */}
        <Tabs.Panel value="settings" pt="md">
          <Stack gap="lg" maw={900}>
            {/* Banner Preview */}
            <Card withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
              <Box pos="relative" h={220}>
                <Image
                  src={settings.bannerImage}
                  alt="Banner Preview"
                  fill
                  style={{ objectFit: "cover" }}
                />
                <Box
                  pos="absolute"
                  style={{ inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }}
                />
                <Box pos="absolute" bottom={20} left={20}>
                  <Text fw={900} size="xl" style={{ color: settings.titleColor, textTransform: "uppercase" }}>
                    {settings.title}
                  </Text>
                  <Text fw={600} size="sm" style={{ color: settings.subtitleColor, textTransform: "uppercase" }}>
                    {settings.subtitle}
                  </Text>
                </Box>
                <Box pos="absolute" top={12} right={12}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                  <Button
                    size="sm"
                    leftSection={<IconUpload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploadingImage}
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    Change Banner
                  </Button>
                </Box>
              </Box>
            </Card>

            {/* Settings form */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Page Title"
                placeholder="Sample Packs"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              />
              <ColorInput
                label="Title Color"
                value={settings.titleColor || "#ffffff"}
                onChange={(color) => setSettings({ ...settings, titleColor: color })}
                popoverProps={{ withinPortal: true }}
                format="hex"
                swatches={['#ffffff', '#000000', '#ea580c', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']}
                closeOnColorSwatchClick
              />
              <TextInput
                label="Page Subtitle"
                placeholder="Curate your own sample pack."
                value={settings.subtitle}
                onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              />
              <ColorInput
                label="Subtitle Color"
                value={settings.subtitleColor || "#ea580c"}
                onChange={(color) => setSettings({ ...settings, subtitleColor: color })}
                popoverProps={{ withinPortal: true }}
                format="hex"
                swatches={['#ffffff', '#000000', '#ea580c', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']}
                closeOnColorSwatchClick
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button
                onClick={handleUpdateSettings}
                loading={updatingSettings}
                leftSection={<IconCheck size={16} />}
              >
                Save Settings
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* ══════ Edit Modal ══════ */}
      <Modal
        opened={editOpened}
        onClose={closeEdit}
        title={
          <Group gap="xs">
            <ThemeIcon size={28} variant="light" color={editingSample ? "blue" : "teal"} radius="md">
              {editingSample ? <IconEdit size={14} /> : <IconPlus size={14} />}
            </ThemeIcon>
            <Text fw={700}>{editingSample ? "Edit Sample" : "Create New Sample"}</Text>
          </Group>
        }
        centered
        size="md"
      >
        <Stack gap="md">
          {!editingSample && (
            <Stack gap="xs">
              <Select
                label="Product to Import (Optional)"
                placeholder="Select a product from catalog"
                description="Selecting a product will automatically fill in the name and image."
                data={productSamples.map(ps => ({ value: ps.productId, label: ps.name }))}
                searchable
                nothingFoundMessage="No products found"
                value={editForm.productId || ""}
                onChange={(val) => {
                  const prod = productSamples.find(p => p.productId === val);
                  if (prod) {
                    setEditForm(prev => ({ 
                      ...prev, 
                      productId: val || "",
                      name: prod.name,
                      image: prod.image
                    }));
                    
                    // Populate variants if available
                    if (prod.samples && prod.samples.length > 0) {
                      setEditFormVariants(prod.samples.map(s => ({
                        value: Number(s.value) || 5,
                        unit: s.unit || "ml",
                        price: Number(s.price) || 60,
                        discount: 0,
                        id: Math.random().toString()
                      })));
                    } else {
                      setEditFormVariants([{ value: 5, unit: "ml", price: 60, discount: 0, id: Math.random().toString() }]);
                    }
                  } else {
                    setEditForm(prev => ({ ...prev, productId: "", name: "", image: "" }));
                    setEditFormVariants([{ value: 5, unit: "ml", price: 60, discount: 0, id: Math.random().toString() }]);
                  }
                }}
              />
              {editForm.productId && productSamples.find(p => p.productId === editForm.productId)?.samples?.length! > 0 && (
                <Text size="xs" c="dimmed" mt={-10}>
                  {productSamples.find(p => p.productId === editForm.productId)?.samples?.length} predefined variants loaded.
                </Text>
              )}
              <Divider label="Form Details" labelPosition="center" />
            </Stack>
          )}
          <Box pos="relative" h={160} style={{ overflow: "hidden", borderRadius: 8, background: "#f8f9fa" }}>
            {editForm.image ? (
              <>
                <Image src={editForm.image} alt="Preview" fill style={{ objectFit: "cover" }} />
                <ActionIcon 
                  pos="absolute" top={8} right={8} color="red" variant="filled" size="sm"
                  onClick={() => setEditForm(prev => ({ ...prev, image: "", publicId: "" }))}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </>
            ) : (
              <Group justify="center" align="center" h="100%">
                <Stack gap={4} align="center">
                  <IconPhoto size={40} stroke={1.5} color="gray" />
                  <Text size="xs" c="dimmed">No image uploaded</Text>
                </Stack>
              </Group>
            )}
            <Box pos="absolute" bottom={8} right={8}>
              <Button 
                size="compact-xs" 
                variant="white" 
                leftSection={<IconUpload size={12} />}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        setUploadingImage(true);
                        const res = await uploadSampleBanner(reader.result as string, editForm.publicId); 
                        setEditForm(prev => ({ ...prev, image: res.url, publicId: res.public_id }));
                      } catch (err) {
                        notifications.show({ title: "Upload Failed", message: "Failed to upload image", color: "red" });
                      } finally {
                        setUploadingImage(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}
                loading={uploadingImage}
              >
                Upload
              </Button>
            </Box>
          </Box>
          <TextInput
            label="Sample Name"
            placeholder="Sample name"
            required
            value={editForm.name}
            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
          />

          <Box>
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="sm">Sample Variants</Text>
              {!editingSample && (
                <Button 
                  size="compact-xs" 
                  variant="light" 
                  leftSection={<IconPlus size={12} />} 
                  onClick={addVariantField}
                >
                  Add Variant
                </Button>
              )}
            </Group>
            
            <Stack gap="xs">
              {editFormVariants.map((v) => (
                <Card key={v.id} withBorder p="xs" radius="sm">
                  <Stack gap="xs">
                    <Group grow align="flex-end" gap="xs">
                      <NumberInput
                        label="Value"
                        value={v.value}
                        min={1}
                        size="xs"
                        onChange={(val) => updateVariantField(v.id!, "value", Number(val))}
                      />
                      <Select
                        label="Unit"
                        data={["ml", "g", "pcs"]}
                        value={v.unit}
                        size="xs"
                        onChange={(val) => updateVariantField(v.id!, "unit", val)}
                      />
                      <NumberInput
                        label="Price (₹)"
                        value={v.price}
                        min={0}
                        size="xs"
                        onChange={(val) => updateVariantField(v.id!, "price", Number(val))}
                      />
                      {!editingSample && editFormVariants.length > 1 && (
                        <ActionIcon color="red" variant="subtle" onClick={() => removeVariantField(v.id!)} mb={4}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                    <NumberInput
                      label="Discount (%)"
                      value={v.discount}
                      min={0}
                      max={100}
                      size="xs"
                      onChange={(val) => updateVariantField(v.id!, "discount", Number(val))}
                    />
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>

          <Select
            label="Availability"
            data={[
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" },
            ]}
            value={editForm.status}
            onChange={(val) => setEditForm(prev => ({ ...prev, status: val as any }))}
          />

          {editingSample && editForm.productId && (
            <TextInput
              label="Linked Product ID"
              value={editForm.productId}
              readOnly
              disabled
              variant="filled"
              size="xs"
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeEdit} leftSection={<IconX size={16} />}>Cancel</Button>
            <Button 
              onClick={handleSaveEdit} 
              loading={loading} 
              leftSection={<IconCheck size={16} />}
              color="blue"
            >
              {editingSample ? "Update Sample" : `Save ${editFormVariants.length} Sample${editFormVariants.length > 1 ? "s" : ""}`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
