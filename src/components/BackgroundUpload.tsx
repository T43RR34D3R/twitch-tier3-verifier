"use client";

import { useState, useRef } from "react";

interface BackgroundUploadProps {
  currentBackgroundUrl?: string;
  backgroundType: 'gradient' | 'image' | 'solid';
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
}

export default function BackgroundUpload({ currentBackgroundUrl, backgroundType, onUploadSuccess, onUploadError }: BackgroundUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (backgroundType !== 'image') {
    return null; // Only show for image background type
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    // Validate file type on client side
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onUploadError("Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    // Validate file size (max 10MB for backgrounds)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      onUploadError("File too large. Please upload an image smaller than 10MB.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('background', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/upload-background', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      onUploadSuccess(result.url);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Current Background Preview */}
      {currentBackgroundUrl && (
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
            <span className="text-sm text-white/70">Current background:</span>
            <span className="text-xs text-white/50 truncate max-w-[200px]">{currentBackgroundUrl}</span>
          </div>
          <div className="relative h-24 rounded-lg overflow-hidden border border-white/20">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentBackgroundUrl})` }}
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-400 bg-blue-400/10' 
            : 'border-white/30 hover:border-white/50 bg-white/5 hover:bg-white/10'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-600/20 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-white font-medium">Uploading background...</p>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Drop your background here</p>
                <p className="text-white/60 text-sm">or click to browse files</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Requirements */}
      <div className="text-xs text-white/50 space-y-1">
        <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Recommended: High resolution images (1920x1080 or larger)</p>
        <p>• Images will be set to cover the entire background</p>
      </div>
    </div>
  );
}
