"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash, CheckCircle, XCircle, Grid } from "lucide-react";

interface CollectionHighlightItem {
    title: string;
    imageUrl: string;
    buttonLink: string;
}

interface CollectionHighlight {
    _id: string;
    title: string;
    subtitle?: string;
    items: CollectionHighlightItem[];
    isActive: boolean;
    order: number;
}

interface CollectionHighlightListProps {
    highlights: CollectionHighlight[];
    onEdit: (highlight: CollectionHighlight) => void;
    onDelete: (id: string) => void;
}

const CollectionHighlightList: React.FC<CollectionHighlightListProps> = ({ highlights, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {highlights.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                No collection highlights found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        highlights.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell className="font-bold">{item.order}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.title}</span>
                                        <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Grid size={16} className="text-blue-500" />
                                        <span className="text-sm font-semibold">{item.items?.length || 0} Items</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.isActive ? (
                                        <div className="flex items-center text-green-600 gap-1.5">
                                            <CheckCircle size={16} />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600 gap-1.5">
                                            <XCircle size={16} />
                                            <span className="text-sm">Inactive</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(item._id)}>
                                            <Trash size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CollectionHighlightList;
