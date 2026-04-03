'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, File as FileIcon, X, Loader2, Play } from 'lucide-react';
import { convertToWebP } from '@/lib/image-utils';

interface MediaUploaderProps {
    onUploadComplete: (url: string) => void;
    existingMediaUrl?: string;
    label: string;
    helpText?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
    onUploadComplete,
    existingMediaUrl = '',
    label,
    helpText
}) => {
    const [mediaUrl, setMediaUrl] = useState<string>(existingMediaUrl);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isVideo = (url: string) => {
        return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video/upload');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (limit to 10MB for video/image)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File must be smaller than 10MB');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Convert image to WebP format if it's an image
            let fileToUpload = file;
            if (file.type.startsWith('image/')) {
                try {
                    const webpBlob = await convertToWebP(file);
                    fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
                } catch (webpError) {
                    console.error('WebP conversion failed, uploading original file:', webpError);
                    // Fallback to original file
                }
            }

            const formData = new FormData();
            formData.append('file', fileToUpload);

            // Upload to Cloudinary via our admin upload API which supports resource_type: auto
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.url) {
                setMediaUrl(data.url);
                onUploadComplete(data.url);
            } else {
                throw new Error(data.message || 'Failed to upload media');
            }
        } catch (error: any) {
            console.error('Error uploading media:', error);
            setUploadError(`Failed to upload media: ${error.message || 'Please try again'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveMedia = () => {
        setMediaUrl('');
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}>{label}</Label>

            <div className="flex flex-col gap-2">
                {mediaUrl ? (
                    <div className="relative">
                        <div className="relative min-h-40 w-full border rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                            {isVideo(mediaUrl) ? (
                                <div className="relative w-full aspect-video flex items-center justify-center bg-black">
                                    <video
                                        src={mediaUrl}
                                        className="max-h-full max-w-full"
                                        controls
                                    />
                                </div>
                            ) : (
                                <img
                                    src={mediaUrl}
                                    alt={`Uploaded ${label}`}
                                    className="max-h-60 w-auto object-contain p-2"
                                />
                            )}
                        </div>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 bg-red-600/90 hover:bg-red-700 text-white z-10"
                            onClick={handleRemoveMedia}
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div
                        className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 text-center">
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-700">Click to upload {label}</p>
                                <p className="text-xs text-gray-500 mt-1">Images or Videos up to 10MB</p>
                            </div>
                        )}
                    </div>
                )}

                <Input
                    ref={fileInputRef}
                    id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                {uploadError && (
                    <p className="text-sm text-red-500 mt-1">{uploadError}</p>
                )}

                {helpText && (
                    <p className="text-xs text-gray-500 mt-1">{helpText}</p>
                )}
            </div>
        </div>
    );
};

export default MediaUploader;
