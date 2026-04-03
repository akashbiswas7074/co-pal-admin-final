"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    getAllCollectionHighlights,
    createCollectionHighlight,
    updateCollectionHighlight,
    deleteCollectionHighlight
} from "@/lib/database/actions/admin/collection-highlight.actions";
import CollectionHighlightList from "@/components/admin/dashboard/collection-highlight/CollectionHighlightList";
import CollectionHighlightForm from "@/components/admin/dashboard/collection-highlight/CollectionHighlightForm";

export default function CollectionHighlightsPage() {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingHighlight, setEditingHighlight] = useState(null);

    const fetchHighlights = async () => {
        setLoading(true);
        try {
            const res = await getAllCollectionHighlights();
            if (res.success) {
                setHighlights(res.highlights);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Failed to fetch highlights");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHighlights();
    }, []);

    const handleCreate = async (data) => {
        try {
            const res = await createCollectionHighlight(data);
            if (res.success) {
                toast.success(res.message);
                setIsFormOpen(false);
                fetchHighlights();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleUpdate = async (data) => {
        console.log("handleUpdate triggered with data:", JSON.stringify(data, null, 2));
        try {
            const res = await updateCollectionHighlight(editingHighlight._id, data);
            console.log("Server Action Response:", JSON.stringify(res, null, 2));
            if (res.success) {
                toast.success(res.message);
                setIsFormOpen(false);
                setEditingHighlight(null);
                fetchHighlights();
            } else {
                console.error("Update failed:", res.message);
                toast.error(res.message || "Update failed");
            }
        } catch (error: any) {
            console.error("An error occurred in handleUpdate:", error);
            toast.error(error.message || "An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this section?")) return;
        try {
            const res = await deleteCollectionHighlight(id);
            if (res.success) {
                toast.success(res.message);
                fetchHighlights();
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleEdit = (highlight) => {
        setEditingHighlight(highlight);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditingHighlight(null);
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Collection Highlight Grid</h1>
                    <p className="text-muted-foreground">
                        Manage the eye-catching highlight cards on your homepage.
                    </p>
                </div>
                {!isFormOpen && (
                    <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
                        <Plus size={16} /> Add New Section
                    </Button>
                )}
                {isFormOpen && (
                    <Button variant="ghost" onClick={handleCancel} className="flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to List
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            ) : isFormOpen ? (
                <div className="max-w-4xl mx-auto w-full bg-white p-6 rounded-xl border shadow-sm">
                    <h2 className="text-xl font-bold mb-6">
                        {editingHighlight ? "Edit Section" : "Create New Section"}
                    </h2>
                    <CollectionHighlightForm
                        initialData={editingHighlight}
                        onSubmit={editingHighlight ? handleUpdate : handleCreate}
                        onCancel={handleCancel}
                    />
                </div>
            ) : (
                <CollectionHighlightList
                    highlights={highlights}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
