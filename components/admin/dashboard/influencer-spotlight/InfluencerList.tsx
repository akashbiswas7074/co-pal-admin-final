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
import { Edit, Trash, CheckCircle, XCircle, Instagram } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Image from "next/image";

interface Influencer {
    _id: string;
    name: string;
    handle: string;
    platform: "TikTok" | "Instagram";
    mediaUrl: string;
    thumbnailUrl?: string;
    isActive: boolean;
    order: number;
}

interface InfluencerListProps {
    influencers: Influencer[];
    onEdit: (influencer: Influencer) => void;
    onDelete: (id: string) => void;
}

const InfluencerList: React.FC<InfluencerListProps> = ({ influencers, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Order</TableHead>
                        <TableHead className="w-[100px]">Media</TableHead>
                        <TableHead>Influencer</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {influencers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                No influencers found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        influencers.map((inf) => (
                            <TableRow key={inf._id}>
                                <TableCell className="font-bold">{inf.order}</TableCell>
                                <TableCell>
                                    <div className="relative h-16 w-12 rounded overflow-hidden">
                                        <Image
                                            src={inf.thumbnailUrl || inf.mediaUrl}
                                            alt={inf.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{inf.name}</span>
                                        <span className="text-xs text-muted-foreground">{inf.handle}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {inf.platform === "TikTok" ? (
                                            <FaTiktok size={14} />
                                        ) : (
                                            <Instagram size={14} className="text-pink-600" />
                                        )}
                                        <span className="text-sm">{inf.platform}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {inf.isActive ? (
                                        <div className="flex items-center text-green-600 gap-1">
                                            <CheckCircle size={16} />
                                            <span className="text-sm">Active</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-red-600 gap-1">
                                            <XCircle size={16} />
                                            <span className="text-sm">Inactive</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(inf)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(inf._id)}>
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

export default InfluencerList;
