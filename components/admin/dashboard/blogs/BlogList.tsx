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
import { Edit, Trash, Eye, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

interface Blog {
    _id: string;
    title: string;
    author: string;
    date: string;
    isActive: boolean;
    mainImage: string;
}

interface BlogListProps {
    blogs: Blog[];
    onEdit: (blog: Blog) => void;
    onDelete: (id: string) => void;
}

const BlogList: React.FC<BlogListProps> = ({ blogs, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {blogs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                No blogs found. Add your first blog post!
                            </TableCell>
                        </TableRow>
                    ) : (
                        blogs.map((blog) => (
                            <TableRow key={blog._id}>
                                <TableCell>
                                    <div className="relative h-12 w-16 rounded overflow-hidden">
                                        <Image
                                            src={blog.mainImage}
                                            alt={blog.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{blog.title}</TableCell>
                                <TableCell>{blog.author}</TableCell>
                                <TableCell>{format(new Date(blog.date), "MMM dd, yyyy")}</TableCell>
                                <TableCell>
                                    {blog.isActive ? (
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
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(blog)}>
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(blog._id)}>
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

export default BlogList;
