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
import { getAllInfluencers, createInfluencer, updateInfluencer, deleteInfluencer } from "@/lib/database/actions/admin/influencer.actions";
import InfluencerList from "@/components/admin/dashboard/influencer-spotlight/InfluencerList";
import InfluencerForm from "@/components/admin/dashboard/influencer-spotlight/InfluencerForm";

export default function InfluencerSpotlightPage() {
    const { toast } = useToast();
    const [influencers, setInfluencers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormLoading, setIsFormLoading] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingInfluencer, setEditingInfluencer] = useState<any>(null);

    const fetchInfluencers = async () => {
        setIsLoading(true);
        try {
            const data = await getAllInfluencers();
            setInfluencers(data);
        } catch (error) {
            console.error("Error fetching influencers:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch influencers.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInfluencers();
    }, []);

    const handleOpenCreate = () => {
        setEditingInfluencer(null);
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (inf: any) => {
        setEditingInfluencer(inf);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this influencer spotlight?")) return;
        try {
            const res = await deleteInfluencer(id);
            if (res.success) {
                toast({ title: "Success", description: "Influencer deleted successfully." });
                fetchInfluencers();
            } else {
                toast({ variant: "destructive", title: "Error", description: res.error });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete influencer." });
        }
    };

    const handleSubmit = async (data: any) => {
        setIsFormLoading(true);
        try {
            let res;
            if (editingInfluencer) {
                res = await updateInfluencer(editingInfluencer._id, data);
            } else {
                res = await createInfluencer(data);
            }

            if (res.success) {
                toast({ title: "Success", description: `Influencer ${editingInfluencer ? "updated" : "added"} successfully.` });
                setIsSheetOpen(false);
                fetchInfluencers();
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
                    <h2 className="text-3xl font-bold tracking-tight">Influencer Spotlight</h2>
                    <p className="text-muted-foreground">
                        Manage your influencer collaborations and social proof.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchInfluencers} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Influencer
                    </Button>
                </div>
            </div>

            <InfluencerList
                influencers={influencers}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingInfluencer ? "Edit Influencer Spotlight" : "Add New Influencer Spotlight"}</SheetTitle>
                        <SheetDescription>
                            Enter the influencer's details and media link below.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                        <InfluencerForm
                            initialData={editingInfluencer}
                            onSubmit={handleSubmit}
                            isLoading={isFormLoading}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
