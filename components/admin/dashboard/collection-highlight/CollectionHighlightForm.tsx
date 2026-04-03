"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash, ExternalLink, MoveUp, MoveDown } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

import { RichTextEditor } from "@/components/ui/rich-text-editor";

const itemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    imageUrl: z.string().min(1, "Image URL is required"),
    buttonText: z.string().min(1, "Button text is required"),
    buttonLink: z.string().min(1, "Link is required"),
    gridSpan: z.number().min(1).max(3),
    bgGradient: z.string(),
    titleColor: z.string(),
    descriptionColor: z.string(),
    buttonColor: z.string(),
    buttonTextColor: z.string(),
});

const formSchema = z.object({
    title: z.string().min(1, "Section title is required"),
    subtitle: z.string(),
    isActive: z.boolean(),
    order: z.number(),
    titleColor: z.string(),
    subtitleColor: z.string(),
    backgroundColor: z.string(),
    items: z.array(itemSchema).min(1, "At least one item is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CollectionHighlightFormProps {
    initialData?: any;
    onSubmit: (data: FormValues) => void;
    onCancel: () => void;
}

const CollectionHighlightForm: React.FC<CollectionHighlightFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
}) => {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: React.useMemo(() => {
            if (!initialData) {
                return {
                    title: "",
                    subtitle: "",
                    isActive: true,
                    order: 0,
                    titleColor: "#000000",
                    subtitleColor: "#666666",
                    backgroundColor: "#ffffff",
                    items: [
                        {
                            title: "",
                            description: "",
                            imageUrl: "",
                            buttonText: "Shop Now",
                            buttonLink: "",
                            gridSpan: 1,
                            bgGradient: "",
                            titleColor: "#000000",
                            descriptionColor: "#666666",
                            buttonColor: "#ffffff",
                            buttonTextColor: "#000000",
                        },
                    ],
                };
            }

            // Merge initialData with defaults to ensure all fields are present for Zod
            return {
                ...initialData,
                titleColor: initialData.titleColor || "#000000",
                subtitleColor: initialData.subtitleColor || "#666666",
                backgroundColor: initialData.backgroundColor || "#ffffff",
                order: initialData.order ?? 0,
                subtitle: initialData.subtitle || "",
                items: initialData.items.map((item: any) => ({
                    ...item,
                    description: item.description || "",
                    gridSpan: item.gridSpan || 1,
                    bgGradient: item.bgGradient || "",
                    titleColor: item.titleColor || "#000000",
                    descriptionColor: item.descriptionColor || "#666666",
                    buttonColor: item.buttonColor || "#ffffff",
                    buttonTextColor: item.buttonTextColor || "#000000",
                    buttonText: item.buttonText || "Shop Now",
                    buttonLink: item.buttonLink || "",
                })),
            };
        }, [initialData]),
    });

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "items",
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="Most Loved Fragrance Collections" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="subtitle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section Subtitle</FormLabel>
                                <FormControl>
                                    <Input placeholder="Discover inspired hits, signature originals..." {...field} />
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
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            field.onChange(isNaN(val) ? 0 : val);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="titleColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section Title Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#000000"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#000000"
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
                        name="subtitleColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section Subtitle Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#666666"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#666666"
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
                        name="backgroundColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Section Background Color</FormLabel>
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
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Active Status</FormLabel>
                                <FormDescription>Show or hide this section on the homepage</FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Grid Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => append({
                                title: "",
                                description: "",
                                imageUrl: "",
                                buttonText: "Shop Now",
                                buttonLink: "",
                                gridSpan: 1,
                                bgGradient: "",
                                titleColor: "#000000",
                                descriptionColor: "#666666",
                                buttonColor: "#ffffff",
                                buttonTextColor: "#000000",
                            })}
                        >
                            <Plus size={16} /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-6 border rounded-xl bg-gray-50/50 space-y-6 relative">
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => index > 0 && move(index, index - 1)}
                                        disabled={index === 0}
                                    >
                                        <MoveUp size={16} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => index < fields.length - 1 && move(index, index + 1)}
                                        disabled={index === fields.length - 1}
                                    >
                                        <MoveDown size={16} />
                                    </Button>
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash size={16} />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.title`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Item Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. 34ml Editions" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.titleColor`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Item Title Color</FormLabel>
                                                        <FormControl>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="color"
                                                                    className="p-1 h-9 w-12 cursor-pointer border rounded"
                                                                    value={field.value || "#000000"}
                                                                    onChange={(e) => field.onChange(e.target.value)}
                                                                />
                                                                <Input
                                                                    placeholder="#000000"
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
                                            name={`items.${index}.buttonLink`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Button Link</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <Input placeholder="/collections/34ml" {...field} />
                                                            <Button variant="outline" size="icon" asChild>
                                                                <a href={field.value} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink size={16} />
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 mb-4">
                                            <FormField
                                                control={form.control}
                                                name={`items.${index}.buttonText`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Button Text</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`items.${index}.buttonColor`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Item Button Color</FormLabel>
                                                            <FormControl>
                                                                <div className="flex gap-1">
                                                                    <input
                                                                        type="color"
                                                                        className="p-1 h-9 w-8 cursor-pointer border rounded"
                                                                        value={field.value || "#ffffff"}
                                                                        onChange={(e) => field.onChange(e.target.value)}
                                                                    />
                                                                    <Input
                                                                        placeholder="#ffffff"
                                                                        className="text-xs px-2"
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
                                                    name={`items.${index}.buttonTextColor`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Item Button Text Color</FormLabel>
                                                            <FormControl>
                                                                <div className="flex gap-1">
                                                                    <input
                                                                        type="color"
                                                                        className="p-1 h-9 w-8 cursor-pointer border rounded"
                                                                        value={field.value || "#000000"}
                                                                        onChange={(e) => field.onChange(e.target.value)}
                                                                    />
                                                                    <Input
                                                                        placeholder="#000000"
                                                                        className="text-xs px-2"
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
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.gridSpan`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grid Span</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={2}
                                                            {...field}
                                                            value={field.value ?? ""}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                field.onChange(isNaN(val) ? 1 : val);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>1 or 2</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.imageUrl`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ImageUploader
                                                            label="Item Image"
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
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Item Description (optional)</FormLabel>
                                                    <FormControl>
                                                        <RichTextEditor
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            height={200}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.descriptionColor`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Item Description Color</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                className="p-1 h-9 w-12 cursor-pointer border rounded"
                                                                value={field.value || "#666666"}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="#666666"
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
                                            name={`items.${index}.bgGradient`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Background Gradient (optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="linear-gradient(...)" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Color pickers moved next to fields */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? "Update Section" : "Create Section"}
                    </Button>
                </div>
            </form>
        </Form >
    );
};

export default CollectionHighlightForm;
