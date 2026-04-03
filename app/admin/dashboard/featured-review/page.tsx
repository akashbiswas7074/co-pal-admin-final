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
import { getAllFeaturedReviews, createFeaturedReview, updateFeaturedReview, deleteFeaturedReview } from "@/lib/database/actions/admin/featured-review.actions";
import ReviewList from "@/components/admin/dashboard/featured-review/ReviewList";
import ReviewForm from "@/components/admin/dashboard/featured-review/ReviewForm";

export default function FeaturedReviewPage() {
    const { toast } = useToast();
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<any>(null);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const data = await getAllFeaturedReviews();
            setReviews(data);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch reviews.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleOpenCreate = () => {
        setEditingReview(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (rev: any) => {
        setEditingReview(rev);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this featured review?")) return;
        try {
            const res = await deleteFeaturedReview(id);
            if (res.success) {
                toast({ title: "Success", description: "Review deleted successfully." });
                fetchReviews();
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete review." });
        }
    };

    const handleSubmit = async (data: any) => {
        setIsFormLoading(true);
        try {
            let res;
            if (editingReview) {
                res = await updateFeaturedReview(editingReview._id, data);
            } else {
                res = await createFeaturedReview(data);
            }

            if (res.success) {
                toast({ title: "Success", description: `Review ${editingReview ? "updated" : "created"} successfully.` });
                setIsSheetOpen(false);
                fetchReviews();
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
                    <h2 className="text-3xl font-bold tracking-tight">Featured Review Hero</h2>
                    <p className="text-muted-foreground">
                        Manage the large quote and testimonial section on the homepage.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchReviews} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Review
                    </Button>
                </div>
            </div>

            <ReviewList
                reviews={reviews}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingReview ? "Edit Featured Review" : "Add New Featured Review"}</SheetTitle>
                        <SheetDescription>
                            Enter the review quote and reviewer details below.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                        <ReviewForm
                            initialData={editingReview}
                            onSubmit={handleSubmit}
                            isLoading={isFormLoading}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
