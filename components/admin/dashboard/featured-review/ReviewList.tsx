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
import { Edit, Trash, Star, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

interface FeaturedReview {
    _id: string;
    quote: string;
    reviewerName: string;
    stars: number;
    isActive: boolean;
    order: number;
    backgroundImage?: string;
}

interface ReviewListProps {
    reviews: FeaturedReview[];
    onEdit: (review: FeaturedReview) => void;
    onDelete: (id: string) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead className="w-[120px]">Preview</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead className="max-w-[300px]">Quote</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                No featured reviews found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        reviews.map((rev) => (
                            <TableRow key={rev._id}>
                                <TableCell className="font-bold">{rev.order}</TableCell>
                                <TableCell>
                                    {rev.backgroundImage ? (
                                        <div className="relative h-12 w-20 rounded overflow-hidden">
                                            <Image
                                                src={rev.backgroundImage}
                                                alt="Background"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-12 w-20 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                            No BG
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{rev.reviewerName}</TableCell>
                                <TableCell className="max-w-[300px] truncate">{rev.quote}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-0.5 text-yellow-500">
                                        <Star size={14} fill="currentColor" />
                                        <span className="text-sm font-bold">{rev.stars}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {rev.isActive ? (
                                        <div className="flex items-center text-green-600 gap-1.2">
                                            <CheckCircle size={16} />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600 gap-1.2">
                                            <XCircle size={16} />
                                            <span className="text-sm">Inactive</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(rev)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(rev._id)}>
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

export default ReviewList;
