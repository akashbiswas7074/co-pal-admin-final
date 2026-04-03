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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

const reviewSchema = z.object({
    quote: z.string().min(10, "Quote must be at least 10 characters"),
    reviewerName: z.string().min(2, "Reviewer name must be at least 2 characters"),
    reviewerSubtext: z.string(),
    stars: z.coerce.number().min(1).max(5),
    totalReviewsText: z.string(),
    averageRatingText: z.string(),
    isActive: z.boolean(),
    isVerified: z.boolean(),
    order: z.coerce.number(),
    backgroundImage: z.string(),
    quoteColor: z.string(),
    reviewerNameColor: z.string(),
    reviewerSubtextColor: z.string(),
    socialProofColor: z.string(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
    initialData?: any;
    onSubmit: (data: ReviewFormValues) => Promise<void>;
    isLoading: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: React.useMemo(() => ({
            quote: initialData?.quote || "",
            reviewerName: initialData?.reviewerName || "",
            reviewerSubtext: initialData?.reviewerSubtext || "Verified Buyer",
            stars: initialData?.stars || 5,
            totalReviewsText: initialData?.totalReviewsText || "40K+",
            averageRatingText: initialData?.averageRatingText || "4.9",
            isActive: initialData?.isActive ?? true,
            isVerified: initialData?.isVerified ?? true,
            order: initialData?.order ?? 0,
            backgroundImage: initialData?.backgroundImage || "",
            quoteColor: initialData?.quoteColor || "#ffffff",
            reviewerNameColor: initialData?.reviewerNameColor || "#ffffff",
            reviewerSubtextColor: initialData?.reviewerSubtextColor || "rgba(255, 255, 255, 0.7)",
            socialProofColor: initialData?.socialProofColor || "#ffffff",
        }), [initialData]),
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="quote"
                        render={({ field }) => (
                            <FormItem className="col-span-full">
                                <FormLabel>Review Quote</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="The name says it all..." className="h-32 text-lg italic" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="quoteColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quote Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#ffffff"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#ffffff"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="reviewerName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reviewer Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Victoria J." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reviewerNameColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reviewer Name Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#ffffff"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#ffffff"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reviewerSubtext"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reviewer Subtext</FormLabel>
                                <FormControl>
                                    <Input placeholder="Verified Buyer" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="reviewerSubtextColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reviewer Subtext Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "rgba(255, 255, 255, 0.7)"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#ffffff or rgba"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="stars"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Star Rating (1-5)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.5" {...field} />
                                </FormControl>
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

                    <FormField
                        control={form.control}
                        name="totalReviewsText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Reviews Label</FormLabel>
                                <FormControl>
                                    <Input placeholder="40K+" {...field} />
                                </FormControl>
                                <FormDescription>Social proof number</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="averageRatingText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Average Rating Label</FormLabel>
                                <FormControl>
                                    <Input placeholder="4.9" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="socialProofColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Social Proof Text Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#ffffff"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#ffffff"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="backgroundImage"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImageUploader
                                    label="Background Image"
                                    existingImageUrl={field.value}
                                    onUploadComplete={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Active</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isVerified"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Verified Badge</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="backgroundImage"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <ImageUploader
                                    label="Background Image"
                                    existingImageUrl={field.value}
                                    onUploadComplete={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Active</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isVerified"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Verified Badge</FormLabel>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Review" : "Create Review"}
                </Button>
            </form>
        </Form>
    );
};

export default ReviewForm;
