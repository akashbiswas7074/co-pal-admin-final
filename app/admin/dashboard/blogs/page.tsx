"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCcw } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { getAllBlogs, createBlog, updateBlog, deleteBlog } from "@/lib/database/actions/admin/blog.actions";
import BlogList from "@/components/admin/dashboard/blogs/BlogList";
import BlogForm from "@/components/admin/dashboard/blogs/BlogForm";

export default function BlogsPage() {
    const { toast } = useToast();
    const [blogs, setBlogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<any>(null);

    const fetchBlogs = async () => {
        setIsLoading(true);
        try {
            const data = await getAllBlogs();
            setBlogs(data);
        } catch (error) {
            console.error("Error fetching blogs:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch blogs.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleOpenCreate = () => {
        setEditingBlog(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (blog: any) => {
        setEditingBlog(blog);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) return;
        try {
            const res = await deleteBlog(id);
            if (res.success) {
                toast({ title: "Success", description: "Blog deleted successfully." });
                fetchBlogs();
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete blog." });
        }
    };

    const handleSubmit = async (data: any) => {
        setIsFormLoading(true);
        try {
            let res;
            if (editingBlog) {
                res = await updateBlog(editingBlog._id, data);
            } else {
                res = await createBlog(data);
            }

            if (res.success) {
                toast({ title: "Success", description: `Blog ${editingBlog ? "updated" : "created"} successfully.` });
                setIsSheetOpen(false);
                fetchBlogs();
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Operation failed." });
        } finally {
            setIsFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
                    <p className="text-muted-foreground">
                        Create and manage blog posts for your website.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchBlogs} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Blog
                    </Button>
                </div>
            </div>

            <BlogList
                blogs={blogs}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingBlog ? "Edit Blog Post" : "Create New Blog Post"}</SheetTitle>
                        <SheetDescription>
                            Enter the details for your blog post below.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                        <BlogForm
                            initialData={editingBlog}
                            onSubmit={handleSubmit}
                            isLoading={isFormLoading}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
