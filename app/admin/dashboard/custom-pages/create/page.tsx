"use client";

import React, { useState } from "react";
import { CustomPageForm } from "@/components/admin/dashboard/custom-pages/CustomPageForm";
import { createCustomPage } from "@/lib/database/actions/admin/custom-pages.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateCustomPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (data: any) => {
    setLoading(true);
    try {
      const res = await createCustomPage(data);
      if (res.success) {
        toast.success("Custom page created successfully!");
        router.push("/admin/dashboard/custom-pages");
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("An error occurred while creating the page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CustomPageForm onSubmit={handleCreate} loading={loading} />
    </div>
  );
}
