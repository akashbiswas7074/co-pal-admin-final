import React, { useRef, useState, useEffect } from "react";
import { Button, Group, Text, TextInput, Select, Switch, Paper, Stack, ActionIcon, Box, FileInput, SimpleGrid, Image } from "@mantine/core";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { IoPencil, IoTrash, IoAdd } from "react-icons/io5";
import { modals } from "@mantine/modals";

import { useRouter } from "next/navigation";
import {
  deleteSubCategory,
  updateSubCategory,
} from "@/lib/database/actions/admin/subCategories/subcategories.actions";
import { getTagsBySubCategory, createTag, updateTag, deleteTag } from "@/lib/database/actions/admin/tags/tags.actions";

const fletobase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const SubCategoryListItem = ({
  subCategory,
  setSubCategories,
  categories,
}: {
  subCategory: any;
  categories: any;
  setSubCategories: any;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [images, setImages] = useState<any[]>(subCategory.images || []);
  const [tags, setTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [showTags, setShowTags] = useState<boolean>(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagMandatory, setNewTagMandatory] = useState(false);
  const [editTagName, setEditTagName] = useState("");
  const [editTagMandatory, setEditTagMandatory] = useState(false);

  const [uploading, setUploading] = useState(false);

  const input = useRef<any>(null);
  const router = useRouter();

  const handleImageChange = async (files: File[]) => {
    const base64Images = await Promise.all(files.map(fletobase64));
    setImages((prev) => [...prev, ...base64Images]);
  };

  // Fetch tags for this sub-category
  useEffect(() => {
    const fetchTags = async () => {
      if (subCategory._id) {
        setLoadingTags(true);
        try {
          const result = await getTagsBySubCategory(subCategory._id);
          if (result?.success && result.tags) {
            setTags(result.tags);
          }
        } catch (error) {
          console.error("Error fetching tags:", error);
        } finally {
          setLoadingTags(false);
        }
      }
    };
    fetchTags();
  }, [subCategory._id]);
  const handleRemoveSubCategory = async (subCategoryId: string) => {
    try {
      await deleteSubCategory(subCategoryId)
        .then((res) => {
          if (res?.success) {
            setSubCategories(res?.subCategories);
            alert(res?.message);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };
  const handleUpdateSubCategory = async (subCategoryId: string) => {
    try {
      setUploading(true);
      const updatedParent = parent ? parent : subCategory?.parent?._id || null;
      await updateSubCategory(
        subCategoryId,
        name || subCategory.name.toString(),
        updatedParent,
        images
      )
        .then((res) => {
          if (res?.success) {
            alert(res?.message);
            setOpen(false);
            setName("");
            setParent("");
            setUploading(false);
            router.refresh();
          }
        })
        .catch((err) => {
          alert(err);
          setUploading(false);
        });
    } catch (error: any) {
      alert(error);
      setUploading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alert("Tag name is required");
      return;
    }
    try {
      const result = await createTag(newTagName, subCategory._id, newTagMandatory);
      if (result?.success) {
        // Refresh tags
        const tagsResult = await getTagsBySubCategory(subCategory._id);
        if (tagsResult?.success && tagsResult.tags) {
          setTags(tagsResult.tags);
        }
        setNewTagName("");
        setNewTagMandatory(false);
        alert(result.message);
      } else {
        alert(result?.message || "Failed to create tag");
      }
    } catch (error: any) {
      alert(error.message || "Error creating tag");
    }
  };

  const handleEditTag = (tag: any) => {
    setEditingTagId(tag._id);
    setEditTagName(tag.name);
    setEditTagMandatory(tag.isMandatory || tag.type === 'MANDATORY_UNIVERSAL');
  };

  const handleUpdateTag = async (tagId: string) => {
    if (!editTagName.trim()) {
      alert("Tag name is required");
      return;
    }
    try {
      const result = await updateTag(tagId, editTagName, editTagMandatory);
      if (result?.success) {
        // Refresh tags
        const tagsResult = await getTagsBySubCategory(subCategory._id);
        if (tagsResult?.success && tagsResult.tags) {
          setTags(tagsResult.tags);
        }
        setEditingTagId(null);
        setEditTagName("");
        setEditTagMandatory(false);
        alert(result.message);
      } else {
        alert(result?.message || "Failed to update tag");
      }
    } catch (error: any) {
      alert(error.message || "Error updating tag");
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    modals.openConfirmModal({
      title: "Delete Tag",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete the tag "{tagName}"? This action is irreversible.
        </Text>
      ),
      labels: {
        confirm: "Delete Tag",
        cancel: "Cancel",
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          const result = await deleteTag(tagId);
          if (result?.success) {
            // Refresh tags
            const tagsResult = await getTagsBySubCategory(subCategory._id);
            if (tagsResult?.success && tagsResult.tags) {
              setTags(tagsResult.tags);
            }
            alert(result.message);
          } else {
            alert(result?.message || "Failed to delete tag");
          }
        } catch (error: any) {
          alert(error.message || "Error deleting tag");
        }
      },
    });
  };

  const cancelEditTag = () => {
    setEditingTagId(null);
    setEditTagName("");
    setEditTagMandatory(false);
  };

  return (
    <div>
      <li className="flex flex-col p-[10px] bg-blue-400 mt-[10px] text-white font-bold">
        <div className="flex items-center justify-between w-full">
          <TextInput
            value={name ? name : subCategory.name}
            onChange={(e) => setName(e.target.value)}
            disabled={!open}
            ref={input}
            className={
              open ? "bg-white !text-black flex-1" : "text-white bg-transparent flex-1"
            }
          />
          {open && (
            <Group ml="md">
              <select
                name="parent"
                value={parent || subCategory?.parent?._id}
                onChange={(e: any) => setParent(e.target.value)}
                disabled={!open}
                className="text-black h-[35px] pl-[0.5rem] outline-none rounded"
              >
                {categories.map((c: any) => (
                  <option value={c._id} key={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => handleUpdateSubCategory(subCategory._id)}
                loading={uploading}
              >
                Save
              </Button>
              <Button
                color="red"
                onClick={() => {
                  setOpen(false);
                  setName("");
                  setParent("");
                  setImages(subCategory.images || []);
                }}
              >
                Cancel
              </Button>
            </Group>
          )}
          <div className="flex">
            {!open && (
              <AiTwotoneEdit
                className="w-[22px] h-[22px] cursor-pointer ml-[1rem]"
                onClick={() => {
                  setOpen((prev) => !prev);
                  setName(subCategory.name);
                  setParent(subCategory?.parent?._id || "");
                  input?.current?.focus();
                }}
              />
            )}
            <AiFillDelete
              className="w-[22px] h-[22px] cursor-pointer ml-[1rem]"
              onClick={() => {
                modals.openConfirmModal({
                  title: "Delete Sub category",
                  centered: true,
                  children: (
                    <Text size="sm">
                      Are you sure you want to delete Sub category? This action is
                      irreversible.
                    </Text>
                  ),
                  labels: {
                    confirm: "Delete Sub Category",
                    cancel: "No don't delete it",
                  },
                  confirmProps: { color: "red" },
                  onCancel: () => console.log("Cancel"),
                  onConfirm: () => handleRemoveSubCategory(subCategory._id),
                });
              }}
            />
          </div>
        </div>

        {open && (
          <Box mt="md" p="sm" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
            <FileInput
              label="Add New Images"
              placeholder="Choose files"
              multiple
              accept="image/*"
              onChange={(files) => handleImageChange(files)}
              className="mb-4"
              styles={{ label: { color: 'white' } }}
            />

            <SimpleGrid cols={4} spacing="xs">
              {images.map((img, index) => (
                <Box key={index} pos="relative">
                  <Image
                    src={typeof img === 'string' ? img : img.url}
                    alt={`Preview ${index}`}
                    width="100%"
                    height={80}
                    fit="cover"
                    radius="sm"
                  />
                  <Button
                    color="red"
                    size="xs"
                    pos="absolute"
                    top={2}
                    right={2}
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    style={{ padding: 0, width: 16, height: 16, borderRadius: 8, minWidth: 0 }}
                  >
                    &times;
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </li>

      {/* Tags Section */}
      <div className="bg-blue-50 mt-[5px] p-4">
        <div className="flex justify-between items-center mb-2">
          <Text fw={600} size="sm">Tags ({tags.length})</Text>
          <Button
            size="xs"
            variant="subtle"
            onClick={() => setShowTags(!showTags)}
          >
            {showTags ? "Hide" : "Show"} Tags
          </Button>
        </div>

        {showTags && (
          <Stack gap="xs">
            {/* Add New Tag */}
            <Paper p="xs" withBorder>
              <Group>
                <TextInput
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Switch
                  label="Mandatory"
                  checked={newTagMandatory}
                  onChange={(e) => setNewTagMandatory(e.currentTarget.checked)}
                />
                <Button
                  size="xs"
                  leftSection={<IoAdd />}
                  onClick={handleCreateTag}
                >
                  Add Tag
                </Button>
              </Group>
            </Paper>

            {/* Existing Tags */}
            {loadingTags ? (
              <Text size="sm" c="dimmed">Loading tags...</Text>
            ) : tags.length === 0 ? (
              <Text size="sm" c="dimmed">No tags found. Add a tag above.</Text>
            ) : (
              tags.map((tag: any) => (
                <Paper
                  key={tag._id}
                  p="xs"
                  withBorder
                  style={{
                    borderColor: editingTagId === tag._id ? "orange" : undefined,
                    borderWidth: editingTagId === tag._id ? 2 : undefined,
                  }}
                >
                  {editingTagId === tag._id ? (
                    <Group>
                      <TextInput
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Switch
                        label="Mandatory"
                        checked={editTagMandatory}
                        onChange={(e) => setEditTagMandatory(e.currentTarget.checked)}
                      />
                      <Button
                        size="xs"
                        color="orange"
                        leftSection={<IoPencil />}
                        onClick={() => handleUpdateTag(tag._id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        color="gray"
                        onClick={cancelEditTag}
                      >
                        Cancel
                      </Button>
                    </Group>
                  ) : (
                    <Group justify="space-between">
                      <Group>
                        <Text size="sm" fw={500}>{tag.name}</Text>
                        {(tag.isMandatory || tag.type === 'MANDATORY_UNIVERSAL') ? (
                          <Text size="xs" c="red" fw={600}>(Mandatory)</Text>
                        ) : (
                          <Text size="xs" c="dimmed">(Optional)</Text>
                        )}
                      </Group>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          size="sm"
                          onClick={() => handleEditTag(tag)}
                        >
                          <IoPencil />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => handleDeleteTag(tag._id, tag.name)}
                        >
                          <IoTrash />
                        </ActionIcon>
                      </Group>
                    </Group>
                  )}
                </Paper>
              ))
            )}
          </Stack>
        )}
      </div>
    </div>
  );
};

export default SubCategoryListItem;
