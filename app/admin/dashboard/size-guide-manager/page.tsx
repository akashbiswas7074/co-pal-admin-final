"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Plus } from "lucide-react";
import {
    getAllCategorySizeGuides,
    getCategorySizeGuide,
    upsertCategorySizeGuide,
    deleteCategorySizeGuide,
} from "@/lib/database/actions/admin/size-guide.actions";
import { getAllSubCategoriesandCategories } from "@/lib/database/actions/admin/subCategories/subcategories.actions";

export default function SizeGuideManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [filteredSubCategories, setFilteredSubCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [title, setTitle] = useState("Size Guide");
    const [htmlContent, setHtmlContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [existingSizeGuides, setExistingSizeGuides] = useState<any[]>([]);
    const [currentGuideId, setCurrentGuideId] = useState("");
    const htmlContentRef = useRef<string>(""); // Ref to store content without triggering saves

    // Load categories and subcategories on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [catData, guidesData] = await Promise.all([
                getAllSubCategoriesandCategories(),
                getAllCategorySizeGuides(),
            ]);

            if (catData?.success) {
                setCategories(catData.categories || []);
                setSubCategories(catData.subCategories || []);
            }

            if (guidesData?.success) {
                setExistingSizeGuides(guidesData.sizeGuides || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
        }
    };

    // Filter subcategories when category changes
    useEffect(() => {
        if (selectedCategory) {
            const filtered = subCategories.filter(
                (sub: any) => sub.parent?._id === selectedCategory || sub.parent === selectedCategory
            );
            setFilteredSubCategories(filtered);
        } else {
            setFilteredSubCategories([]);
        }
        setSelectedSubCategory(""); // Reset subcategory selection
    }, [selectedCategory, subCategories]);

    // Load existing guide when category & subcategory selected
    useEffect(() => {
        if (selectedCategory && selectedSubCategory) {
            loadExistingGuide();
        } else {
            // Reset form
            setTitle("Size Guide");
            setHtmlContent("");
            setCurrentGuideId("");
        }
    }, [selectedCategory, selectedSubCategory]);

    const loadExistingGuide = async () => {
        try {
            setLoading(true);
            const categoryName = categories.find((c) => c._id === selectedCategory)?.name || "";
            const subCategoryName = filteredSubCategories.find((s) => s._id === selectedSubCategory)?.name || "";

            const result = await getCategorySizeGuide(categoryName, subCategoryName);

            if (result.success && result.sizeGuide) {
                setTitle(result.sizeGuide.title || "Size Guide");
                setHtmlContent(result.sizeGuide.htmlContent || "");
                setCurrentGuideId(result.sizeGuide._id);
                toast.success("Loaded existing size guide");
            } else {
                // No existing guide
                setTitle("Size Guide");
                setHtmlContent("");
                setCurrentGuideId("");
                toast.info("No existing guide found. Create a new one.");
            }
        } catch (error) {
            console.error("Error loading guide:", error);
            toast.error("Failed to load size guide");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCategory || !selectedSubCategory) {
            toast.error("Please select both category and subcategory");
            return;
        }

        // Use ref content for saving
        const contentToSave = htmlContentRef.current || htmlContent;

        if (!contentToSave.trim()) {
            toast.error("Please add content to the size guide");
            return;
        }

        try {
            setLoading(true);
            const categoryName = categories.find((c) => c._id === selectedCategory)?.name || "";
            const subCategoryName = filteredSubCategories.find((s) => s._id === selectedSubCategory)?.name || "";

            const result = await upsertCategorySizeGuide({
                category: categoryName,
                subCategory: subCategoryName,
                title,
                htmlContent: contentToSave, // Use ref content
            });

            if (result.success) {
                toast.success(result.message);
                setCurrentGuideId(result.sizeGuide._id);
                await loadData(); // Reload the list
            } else {
                toast.error(result.error || "Failed to save size guide");
            }
        } catch (error) {
            console.error("Error saving guide:", error);
            toast.error("Failed to save size guide");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentGuideId) {
            toast.error("No size guide selected to delete");
            return;
        }

        if (!confirm("Are you sure you want to delete this size guide?")) {
            return;
        }

        try {
            setLoading(true);
            const result = await deleteCategorySizeGuide(currentGuideId);

            if (result.success) {
                toast.success(result.message);
                setTitle("Size Guide");
                setHtmlContent("");
                setCurrentGuideId("");
                await loadData();
            } else {
                toast.error(result.error || "Failed to delete size guide");
            }
        } catch (error) {
            console.error("Error deleting guide:", error);
            toast.error("Failed to delete size guide");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Size Guide Manager</h1>
                    <p className="text-gray-600">Manage category-specific size guides with rich HTML content</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Category & Subcategory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat._id} value={cat._id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subcategory">Subcategory</Label>
                            <Select
                                value={selectedSubCategory}
                                onValueChange={setSelectedSubCategory}
                                disabled={!selectedCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubCategories.map((sub) => (
                                        <SelectItem key={sub._id} value={sub._id}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Size Guide Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Men's T-Shirt Size Guide"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={!selectedCategory || !selectedSubCategory}
                        />
                    </div>
                </CardContent>
            </Card>

            {selectedCategory && selectedSubCategory && (
                <Card>
                    <CardHeader>
                        <CardTitle>Size Guide Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RichTextEditor
                            value={htmlContent}
                            onChange={(content) => {
                                htmlContentRef.current = content; // Store in ref
                                setHtmlContent(content); // Also update state for display
                            }}
                            placeholder="Enter your size guide content here. You can use tables, images, formatting, etc."
                            height={400}
                        />

                        <div className="flex gap-2 justify-end">
                            {currentGuideId && (
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button onClick={handleSave} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {currentGuideId ? "Update" : "Create"} Size Guide
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Existing Size Guides List */}
            <Card>
                <CardHeader>
                    <CardTitle>Existing Size Guides ({existingSizeGuides.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {existingSizeGuides.length > 0 ? (
                        <div className="space-y-2">
                            {existingSizeGuides.map((guide) => (
                                <div
                                    key={guide._id}
                                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <p className="font-medium">{guide.title}</p>
                                        <p className="text-sm text-gray-600">
                                            {guide.category} → {guide.subCategory}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const cat = categories.find((c) => c.name === guide.category);
                                            const sub = subCategories.find((s) => s.name === guide.subCategory);
                                            if (cat) setSelectedCategory(cat._id);
                                            if (sub) setSelectedSubCategory(sub._id);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No size guides created yet. Select a category and subcategory to create one.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
