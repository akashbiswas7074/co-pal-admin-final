import React, { useRef, useState } from "react";
import { Button, Group, Text, TextInput, FileInput, SimpleGrid, Box, Image } from "@mantine/core";
import { AiFillDelete, AiTwotoneEdit } from "react-icons/ai";
import { modals } from "@mantine/modals";
import { useRouter } from "next/navigation";
import {
  deleteCategory,
  updateCategory,
} from "@/lib/database/actions/admin/category/category.actions";

const fletobase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CategoryListItem = ({
  category,
  setCategories,
}: {
  category: any;
  setCategories: any;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [images, setImages] = useState<any[]>(category.images || []);
  const input = useRef<any>(null);
  const router = useRouter();

  const handleRemoveCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)
        .then((res) => {
          if (res?.success) {
            setCategories(res?.categories);
            alert(res?.message);
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    try {
      await updateCategory(categoryId, name || category.name, images)
        .then((res) => {
          if (res?.success) {
            setCategories(res?.categories);
            alert(res?.message);
            setOpen(false);
            router.refresh();
          }
        })
        .catch((err) => alert(err));
    } catch (error: any) {
      alert(error);
    }
  };

  const handleImageChange = async (files: File[]) => {
    const base64Images = await Promise.all(files.map(fletobase64));
    setImages((prev) => [...prev, ...base64Images]);
  };

  return (
    <div>
      <li className="flex flex-col p-[10px] bg-blue-400 mt-[10px] text-white font-bold">
        <div className="flex items-center justify-between w-full">
          <TextInput
            value={name ? name : category.name}
            onChange={(e) => setName(e.target.value)}
            disabled={!open}
            ref={input}
            className={
              open ? "bg-white !text-black flex-1" : "text-white bg-transparent flex-1"
            }
          />
          {open && (
            <Group ml="md">
              <Button onClick={() => handleUpdateCategory(category._id)}>
                Save
              </Button>
              <Button
                color="red"
                onClick={() => {
                  setOpen(false);
                  setName("");
                  setImages(category.images || []);
                }}
              >
                Cancel
              </Button>
            </Group>
          )}
          <div className="flex">
            {!open && (
              <AiTwotoneEdit
                className="w-[22px] h-[22px] cursor-pointer ml-[1rem] "
                onClick={() => {
                  setOpen((prev) => !prev);
                  input?.current?.focus();
                }}
              />
            )}
            <AiFillDelete
              className="w-[22px] h-[22px] cursor-pointer ml-[1rem] "
              onClick={() => {
                modals.openConfirmModal({
                  title: "Delete category",
                  centered: true,
                  children: (
                    <Text size="sm">
                      Are you sure you want to delete category? This action is
                      irreversible.
                    </Text>
                  ),
                  labels: {
                    confirm: "Delete category",
                    cancel: "No don't delete it",
                  },
                  confirmProps: { color: "red" },
                  onCancel: () => console.log("Cancel"),
                  onConfirm: () => handleRemoveCategory(category._id),
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
    </div>
  );
};

export default CategoryListItem;
