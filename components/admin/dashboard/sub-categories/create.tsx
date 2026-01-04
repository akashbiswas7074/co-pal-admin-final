"use client";

import { useState } from "react";

import {
  Button,
  FileInput,
  TextInput,
  Image,
  SimpleGrid,
  Box,
  LoadingOverlay,
  Select,
  Paper,
  Stack,
  Group,
  ActionIcon,
  Switch,
  Divider,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { createTag, getTagsByCategory } from "@/lib/database/actions/admin/tags/tags.actions";
import { IoAdd, IoTrash, IoPencil } from "react-icons/io5";
import { useEffect } from "react";

const fletobase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
import { createSubCategory } from "@/lib/database/actions/admin/subCategories/subcategories.actions";

interface TagFormData {
  name: string;
  isMandatory: boolean;
}

const CreateSubCategory = ({
  setSubCategories,
  categories,
}: {
  setSubCategories?: any;
  categories?: any;
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<TagFormData[]>([]);
  const [existingTags, setExistingTags] = useState<any[]>([]);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  
  const form = useForm({
    initialValues: {
      name: "",
      parent: "",
    },
    validate: {
      name: (value) =>
        value.length < 3 || value.length > 30
          ? "Category name must be between 3 to 30 characters."
          : null,
    },
  });
  
  const tagForm = useForm({
    initialValues: {
      tagName: "",
      isMandatory: false,
    },
  });
  
  const addTag = () => {
    if (tagForm.values.tagName.trim()) {
      if (editingTagIndex !== null) {
        // Update existing tag
        const updatedTags = [...tags];
        updatedTags[editingTagIndex] = {
          name: tagForm.values.tagName.trim(),
          isMandatory: tagForm.values.isMandatory,
        };
        setTags(updatedTags);
        setEditingTagIndex(null);
      } else {
        // Add new tag
        setTags([
          ...tags,
          {
            name: tagForm.values.tagName.trim(),
            isMandatory: tagForm.values.isMandatory,
          },
        ]);
      }
      tagForm.reset();
    }
  };
  
  const editTag = (index: number) => {
    const tag = tags[index];
    tagForm.setValues({
      tagName: tag.name,
      isMandatory: tag.isMandatory,
    });
    setEditingTagIndex(index);
  };
  
  const cancelEdit = () => {
    setEditingTagIndex(null);
    tagForm.reset();
  };
  
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
    if (editingTagIndex === index) {
      setEditingTagIndex(null);
      tagForm.reset();
    } else if (editingTagIndex !== null && editingTagIndex > index) {
      // Adjust editing index if a tag before it was deleted
      setEditingTagIndex(editingTagIndex - 1);
    }
  };
  
  // Fetch existing tags from parent category when parent is selected
  useEffect(() => {
    const fetchExistingTags = async () => {
      if (form.values.parent) {
        try {
          const result = await getTagsByCategory(form.values.parent);
          if (result?.success && result.tags) {
            setExistingTags(result.tags);
          } else {
            setExistingTags([]);
          }
        } catch (error) {
          console.error("Error fetching existing tags:", error);
          setExistingTags([]);
        }
      } else {
        setExistingTags([]);
      }
    };
    
    fetchExistingTags();
  }, [form.values.parent]);
  const handleImageChange = async (files: File[]) => {
    const base64Images = await Promise.all(files.map(fletobase64));
    setImages(base64Images);
  };
  const submitHandler = async (values: typeof form.values) => {
    console.log("Submit handler called with values:", values);
    console.log("Images:", images.length);
    console.log("Tags:", tags.length);
    
    try {
      // Validate required fields
      if (!values.name || values.name.trim().length < 3) {
        alert("Sub-category name must be at least 3 characters.");
        setLoading(false);
        return;
      }
      
      if (!values.parent) {
        alert("Please select a parent category.");
        setLoading(false);
        return;
      }
      
      if (images.length === 0) {
        alert("Please upload at least one image.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      console.log("Submitting sub-category:", { name: values.name, parent: values.parent, imagesCount: images.length, tagsCount: tags.length });
      
      // First create the sub-category
      const subCategoryRes = await createSubCategory(values.name, values.parent, images);
      
      if (subCategoryRes?.success) {
        // Get the newly created sub-category ID - prioritize newSubCategory._id
        let subCategoryId: string | undefined = undefined;
        
        if (subCategoryRes.newSubCategory?._id) {
          subCategoryId = subCategoryRes.newSubCategory._id;
        } else if (subCategoryRes.subCategories?.length > 0) {
          // Fallback: find the newly created one by name
          const newSub = subCategoryRes.subCategories.find((sc: any) => sc.name === values.name);
          subCategoryId = newSub?._id;
        }
        
        // Convert to string if it's an ObjectId
        if (subCategoryId) {
          if (typeof subCategoryId !== 'string') {
            subCategoryId = subCategoryId.toString();
          }
        }
        
        console.log("Sub-category created with ID:", subCategoryId);
        console.log("Sub-category response:", JSON.stringify(subCategoryRes, null, 2));
        console.log("Tags to create:", tags);
        
        // Validate subCategoryId before creating tags
        if (!subCategoryId) {
          console.error("ERROR: Sub-category ID is missing! Cannot create tags.");
          alert("Sub-category created but tags could not be added (ID not found). Please check console.");
          setLoading(false);
          return;
        }
        
        // Then create tags for this sub-category
        if (tags.length > 0) {
          console.log(`Creating ${tags.length} tags for sub-category: ${subCategoryId}`);
          const tagResults = await Promise.all(
            tags.map(async (tag) => {
              try {
                console.log(`Creating tag: name="${tag.name}", subCategoryId="${subCategoryId}", isMandatory=${tag.isMandatory}`);
                const result = await createTag(tag.name, subCategoryId!, tag.isMandatory);
                console.log(`Tag "${tag.name}" creation result:`, result);
                if (!result.success) {
                  console.error(`Failed to create tag "${tag.name}":`, result.message);
                }
                return result;
              } catch (error: any) {
                console.error(`Error creating tag "${tag.name}":`, error);
                return { success: false, message: error.message };
              }
            })
          );
          
          const successCount = tagResults.filter((r) => r.success).length;
          const failCount = tagResults.filter((r) => !r.success).length;
          
          if (failCount > 0) {
            alert(
              `Sub-category created! ${successCount} tag(s) added successfully, ${failCount} tag(s) failed. Check console for details.`
            );
          } else {
            alert(
              `Sub-category created successfully! ${tags.length} tag(s) added.`
            );
          }
        } else {
          if (tags.length > 0 && !subCategoryId) {
            console.error("Sub-category ID not found, cannot create tags");
            alert("Sub-category created but tags could not be added (ID not found).");
          } else {
            alert("Sub-category created successfully!");
          }
        }
        
        setSubCategories(subCategoryRes.subCategories);
        form.reset();
        setImages([]);
        setTags([]);
        setEditingTagIndex(null);
        tagForm.reset();
        setLoading(false);
      } else {
        setLoading(false);
        alert(subCategoryRes?.message || "Failed to create sub-category");
      }
    } catch (error: any) {
      console.error("Error in submitHandler:", error);
      alert(`Error: ${error.message || error}`);
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="titleStyle">Create a Sub Category</div>
      <Box pos={"relative"}>
        {loading && (
          <LoadingOverlay
            visible={loading}
            zIndex={1000}
            overlayProps={{ radius: "sm", blur: 2 }}
          />
        )}
        <form onSubmit={form.onSubmit((values) => {
          console.log("Form onSubmit triggered with values:", values);
          submitHandler(values);
        })}>
          <TextInput
            label="Name"
            placeholder="SubCategory name"
            {...form.getInputProps("name")}
            required
          />
          <FileInput
            label="Upload Images for Category"
            placeholder="Choose files"
            multiple
            accept="image/*"
            onChange={(files) => handleImageChange(files)}
            required
          />
          <Select
            label="Parent"
            placeholder="Select parent"
            data={categories?.map((category: any) => ({
              value: category._id,
              label: category.name,
            }))}
            {...form.getInputProps("parent")}
            required
          />
          <SimpleGrid cols={4} spacing={"md"} mt={"md"}>
            {images.map((image, index) => (
              <Box key={index}>
                <Image
                  src={image}
                  alt={`Uploaded image ${index + 1}`}
                  width={"100%"}
                  height={"auto"}
                  fit="cover"
                />
              </Box>
            ))}
          </SimpleGrid>

          <Divider my="md" />

          {/* Tags Section */}
          <Paper p="md" withBorder>
            <Text fw={600} size="lg" mb="md">
              Tags
            </Text>
            <Text size="sm" c="dimmed" mb="md">
              Add tags for this sub-category. Tags can be marked as mandatory or optional.
            </Text>

            {/* Show existing tags from parent category as reference */}
            {existingTags.length > 0 && (
              <Box mb="md" p="sm" bg="gray.0" style={{ borderRadius: 4 }}>
                <Text size="xs" fw={500} mb="xs" c="dimmed">
                  Existing tags in this category's sub-categories (for reference):
                </Text>
                <Group gap="xs">
                  {existingTags.map((tag: any, index: number) => (
                    <Text
                      key={index}
                      size="xs"
                      px="xs"
                      py={2}
                      bg="gray.2"
                      style={{ borderRadius: 4 }}
                      c="dimmed"
                    >
                      {tag.name} {tag.isMandatory && "(M)"}
                    </Text>
                  ))}
                </Group>
              </Box>
            )}

            <Stack gap="md">
              <Group>
                <TextInput
                  placeholder="Tag name (e.g., BRAND, COLOUR, FABRIC, MATERIAL 1, MATERIAL 2)"
                  {...tagForm.getInputProps("tagName")}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Switch
                  label="Mandatory"
                  {...tagForm.getInputProps("isMandatory", { type: "checkbox" })}
                />
                <Button 
                  onClick={addTag} 
                  leftSection={editingTagIndex !== null ? <IoPencil /> : <IoAdd />}
                  color={editingTagIndex !== null ? "orange" : "blue"}
                >
                  {editingTagIndex !== null ? "Update Tag" : "Add Tag"}
                </Button>
                {editingTagIndex !== null && (
                  <Button 
                    onClick={cancelEdit} 
                    variant="outline"
                    color="gray"
                  >
                    Cancel
                  </Button>
                )}
              </Group>

              {tags.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    Added Tags ({tags.length}):
                  </Text>
                  <Stack gap="xs">
                    {tags.map((tag, index) => (
                      <Paper 
                        key={index} 
                        p="xs" 
                        withBorder
                        style={{
                          borderColor: editingTagIndex === index ? "orange" : undefined,
                          borderWidth: editingTagIndex === index ? 2 : undefined,
                        }}
                      >
                        <Group justify="space-between">
                          <Group>
                            <Text fw={500}>{tag.name}</Text>
                            {tag.isMandatory ? (
                              <Text size="xs" c="red" fw={600}>
                                (Mandatory)
                              </Text>
                            ) : (
                              <Text size="xs" c="dimmed">
                                (Optional)
                              </Text>
                            )}
                          </Group>
                          <Group gap="xs">
                            <ActionIcon
                              color="blue"
                              variant="light"
                              onClick={() => editTag(index)}
                              disabled={editingTagIndex !== null && editingTagIndex !== index}
                            >
                              <IoPencil />
                            </ActionIcon>
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => removeTag(index)}
                              disabled={editingTagIndex !== null && editingTagIndex !== index}
                            >
                              <IoTrash />
                            </ActionIcon>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Paper>

          <div className="mt-[1rem]">
            <Button 
              type="submit" 
              className="text-white"
              disabled={loading}
              onClick={(e) => {
                // Prevent double submission
                if (loading) {
                  e.preventDefault();
                  return;
                }
                // Let form handle submission
              }}
            >
              {loading ? "Creating..." : `Add Sub Category${tags.length > 0 ? ` with ${tags.length} Tag(s)` : ""}`}
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};

export default CreateSubCategory;
