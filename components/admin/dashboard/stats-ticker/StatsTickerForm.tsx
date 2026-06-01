
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
import { Plus, Trash, MoveUp, MoveDown } from "lucide-react";

const itemSchema = z.object({
    emoji: z.string().optional(),
    label: z.string().min(1, "Label is required"),
    iconColor: z.string().optional(),  // optional per-item icon/emoji color
    textColor: z.string().optional(),  // optional per-item text color
});

const formSchema = z.object({
    items: z.array(itemSchema).min(1, "At least one item is required"),
    backgroundColor: z.string().min(1, "Background is required"),
    color1: z.string().optional(),
    color2: z.string().optional(),
    speed: z.number().min(5).max(100),
    isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface StatsTickerFormProps {
    initialData?: any;
    onSubmit: (data: FormValues) => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function StatsTickerForm({
    initialData,
    onSubmit,
    onCancel,
    loading = false,
}: StatsTickerFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            items: initialData?.items || [
                { emoji: "🌿", label: "Vegan & Cruelty-Free", iconColor: "", textColor: "" },
            ],
            backgroundColor: initialData?.backgroundColor || "linear-gradient(90deg, #22c9a0 0%, #7c3aed 50%, #e879f9 100%)",
            color1: initialData?.color1 || "#22c9a0",
            color2: initialData?.color2 || "#e879f9",
            speed: initialData?.speed || 28,
            isActive: initialData?.isActive ?? true,
        },
    });

    const color1 = form.watch("color1");
    const color2 = form.watch("color2");

    // Reset form when initialData loads from DB (including saved iconColor/textColor)
    React.useEffect(() => {
        if (initialData) {
            form.reset({
                items: (initialData.items || []).map((item: any) => ({
                    emoji: item.emoji || '',
                    label: item.label || '',
                    iconColor: item.iconColor || '',
                    textColor: item.textColor || '',
                })),
                backgroundColor: initialData.backgroundColor || "linear-gradient(90deg, #22c9a0 0%, #7c3aed 50%, #e879f9 100%)",
                color1: initialData.color1 || "#22c9a0",
                color2: initialData.color2 || "#e879f9",
                speed: initialData.speed || 28,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData]);

    React.useEffect(() => {
        if (color1 && color2) {
            form.setValue("backgroundColor", `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`);
        }
    }, [color1, color2, form]);

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
                        name="color1"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gradient Start Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#22c9a0"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#22c9a0"
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
                        name="color2"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gradient End Color</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="p-1 h-9 w-12 cursor-pointer border rounded"
                                            value={field.value || "#e879f9"}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        />
                                        <Input
                                            placeholder="#e879f9"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: '1.5rem' }}>
                    <FormField
                        control={form.control}
                        name="backgroundColor"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Generated Background Style (Preview)</FormLabel>
                                <FormControl>
                                    <div className="space-y-2">
                                        <Input placeholder="linear-gradient(...)" {...field} readOnly className="bg-gray-50 font-mono text-xs" />
                                        <div
                                            className="h-8 rounded-md border shadow-sm"
                                            style={{ background: field.value }}
                                        />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Automatically updated from color pickers above.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="speed"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Animation Duration (Seconds)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 28)}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Lower is faster. Default is 28.
                                </FormDescription>
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
                                <FormDescription>Enable or disable the ticker</FormDescription>
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
                        <h3 className="text-lg font-bold">Ticker Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            onClick={() => append({ emoji: "✨", label: "New Item", iconColor: "", textColor: "" })}
                        >
                            <Plus size={16} /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50/50 relative group">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 flex-1">
                                    <div className="sm:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.emoji`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Emoji/Icon</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="🌿" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="sm:col-span-6">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.label`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Text Label</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Vegan & Cruelty-Free" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Optional icon color */}
                                    <div className="sm:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.iconColor`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Icon Color <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-1.5 items-center">
                                                            <input
                                                                type="color"
                                                                className="p-0.5 h-8 w-9 cursor-pointer border rounded"
                                                                value={field.value || '#ffffff'}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="#ffffff"
                                                                {...field}
                                                                value={field.value || ''}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {/* Optional text color */}
                                    <div className="sm:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.textColor`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Text Color <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-1.5 items-center">
                                                            <input
                                                                type="color"
                                                                className="p-0.5 h-8 w-9 cursor-pointer border rounded"
                                                                value={field.value || '#ffffff'}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                            <Input
                                                                placeholder="#ffffff"
                                                                {...field}
                                                                value={field.value || ''}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => index > 0 && move(index, index - 1)}
                                        disabled={index === 0}
                                    >
                                        <MoveUp size={14} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => index < fields.length - 1 && move(index, index + 1)}
                                        disabled={index === fields.length - 1}
                                    >
                                        <MoveDown size={14} />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                    >
                                        <Trash size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
