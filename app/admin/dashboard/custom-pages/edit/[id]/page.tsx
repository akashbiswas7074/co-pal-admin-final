"use client";

import React, { useState, useEffect } from "react";
import { CustomPageForm } from "@/components/admin/dashboard/custom-pages/CustomPageForm";
import { getCustomPageById, updateCustomPage } from "@/lib/database/actions/admin/custom-pages.actions";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Loader, Stack, Text, Center } from "@mantine/core";

export default function EditCustomPage() {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { id } = useParams();

  const fetchPage = async () => {
    setLoading(true);
    try {
      const res = await getCustomPageById(id as string);
      if (res.success) {
        setPage(res.page);
      } else {
        toast.error(res.message);
        router.push("/admin/dashboard/custom-pages");
      }
    } catch (error) {
      toast.error("Failed to fetch page data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const handleUpdate = async (data: any) => {
    setSaving(true);
    try {
      const res = await updateCustomPage(id as string, data);
      if (res.success) {
        toast.success("Page updated successfully!");
        router.push("/admin/dashboard/custom-pages");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("An error occurred while updating the page");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Center className="h-[70vh]">
        <Stack align="center" gap="sm">
          <Loader size="xl" variant="bars" color="blue" />
          <Text c="dimmed" size="sm" fw={600}>Loading page editor...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CustomPageForm initialData={page} onSubmit={handleUpdate} loading={saving} />
    </div>
  );
}
