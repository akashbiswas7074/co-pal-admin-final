"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import MediaUploader from "@/components/admin/MediaUploader";

const influencerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    handle: z.string().min(2, "Handle must be at least 2 characters"),
    platform: z.enum(["TikTok", "Instagram"]),
    mediaUrl: z.string().min(1, "Media is required"),
    thumbnailUrl: z.string(),
    productName: z.string(),
    order: z.coerce.number(),
    isActive: z.boolean(),
});

type InfluencerFormValues = z.infer<typeof influencerSchema>;

interface InfluencerFormProps {
    initialData?: any;
    onSubmit: (data: InfluencerFormValues) => Promise<void>;
    isLoading: boolean;
}

const InfluencerForm: React.FC<InfluencerFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const form = useForm<InfluencerFormValues>({
        resolver: zodResolver(influencerSchema),
        defaultValues: initialData || {
            name: "",
            handle: "",
            platform: "TikTok",
            mediaUrl: "",
            thumbnailUrl: "",
            productName: "",
            order: 0,
            isActive: true,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Influencer Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="handle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Social Handle</FormLabel>
                                <FormControl>
                                    <Input placeholder="@johndoe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Platform</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="TikTok">TikTok</SelectItem>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="order"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="mediaUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <MediaUploader
                                    label="Media Content (Video/Image)"
                                    existingMediaUrl={field.value}
                                    onUploadComplete={field.onChange}
                                    helpText="Upload the TikTok, Reel, or static image"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImageUploader
                                    label="Thumbnail Image"
                                    existingImageUrl={field.value}
                                    onUploadComplete={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mentioned Product (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Fragrance Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Active Status</FormLabel>
                                <FormDescription>Show this in the spotlight section.</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Influencer" : "Add Influencer"}
                </Button>
            </form>
        </Form>
    );
};

export default InfluencerForm;
