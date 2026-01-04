import React, { useRef, useState, useEffect } from "react";
import { Button, Group, Text, TextInput, Select, Switch, Paper, Stack, ActionIcon } from "@mantine/core";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { IoPencil, IoTrash, IoAdd } from "react-icons/io5";
import { modals } from "@mantine/modals";

import { useRouter } from "next/navigation";
import {
  deleteSubCategory,
  updateSubCategory,
} from "@/lib/database/actions/admin/subCategories/subcategories.actions";
import { getTagsBySubCategory, createTag, updateTag, deleteTag } from "@/lib/database/actions/admin/tags/tags.actions";

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
  const [tags, setTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState<boolean>(false);
  const [showTags, setShowTags] = useState<boolean>(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagMandatory, setNewTagMandatory] = useState(false);
  const [editTagName, setEditTagName] = useState("");
  const [editTagMandatory, setEditTagMandatory] = useState(false);

  const input = useRef<any>(null);
  const router = useRouter();

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
      const updatedParent = parent ? parent : null;
      await updateSubCategory(
        subCategoryId,
        name || subCategory.name.toString(),
        updatedParent
      )
        .then((res) => {
          if (res?.success) {
            alert(res?.message);
            setOpen(false);
            setName("");
            setParent("");
            router.refresh();
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
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
      <li className="flex p-[10px] bg-blue-400 mt-[10px] text-whit font-bold items-center justify-between">
        <TextInput
          value={name ? name : subCategory.name}
          onChange={(e) => setName(e.target.value)}
          disabled={!open}
          ref={input}
          className={
            open ? "bg-white !text-black" : "text-white bg-transparent"
          }
        />
        {open && (
          <Group>
            <select
              name="parent"
              value={parent || subCategory?.parent?._id}
              onChange={(e: any) => setParent(e.target.value)}
              disabled={!open}
              className="text-black h-[55px] pl-[1rem] outline-none"
            >
              {categories.map((c: any) => (
                <option value={c._id} key={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button onClick={() => handleUpdateSubCategory(subCategory._id)}>
              Save
            </Button>
            <Button
              color="red"
              onClick={() => {
                setOpen(false);
                setName("");
                setParent("");
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
