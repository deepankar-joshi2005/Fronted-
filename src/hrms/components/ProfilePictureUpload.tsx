import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axiosInstance from '@/api/axiosInstance';

interface ProfilePictureUploadProps {
  currentProfilePicture?: string | null;
  onUploadSuccess?: (profilePictureUrl: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showPreview?: boolean;
}

export default function ProfilePictureUpload({
  currentProfilePicture,
  onUploadSuccess,
  onUploadError,
  size = 'md',
  showPreview = true
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentProfilePicture || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      setError('File size must be less than 1MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axiosInstance.post('/profile-picture/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setPreview(response.data.data.profilePicture);
        onUploadSuccess?.(response.data.data.profilePicture);
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setError(null);

    try {
      await axiosInstance.delete('/profile-picture');
      setPreview(null);
      onUploadSuccess?.('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove profile picture';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {showPreview && (
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Picture Display */}
          <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-gray-200`}>
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={handleFileInputClick}
                disabled={isUploading}
                className="px-6"
              >
                <Upload className="h-5 w-5 mr-2" />
                {preview ? 'Change Picture' : 'Upload Picture'}
              </Button>
              
              {preview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="px-6"
                >
                  <X className="h-5 w-5 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            {fileInputRef.current?.files?.[0] && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                size="lg"
                className="w-full max-w-xs"
              >
                {isUploading ? 'Uploading...' : 'Confirm Upload'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Requirements */}
      <div className="text-sm text-gray-600 text-center">
        <p className="font-medium mb-2">Upload Requirements:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-50 p-2 rounded">📏 Auto-resize to 180x180px</div>
          <div className="bg-green-50 p-2 rounded">💾 Max size: 1MB</div>
          <div className="bg-purple-50 p-2 rounded">🖼️ JPG, PNG, GIF, WebP</div>
        </div>
      </div>

      {/* Simple Upload for non-preview mode */}
      {!showPreview && (
        <div className="flex flex-col items-center space-y-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleFileInputClick}
            disabled={isUploading}
            className="px-8"
          >
            <Upload className="h-5 w-5 mr-2" />
            {preview ? 'Change Picture' : 'Upload Picture'}
          </Button>
          
          {preview && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remove Picture
            </Button>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Button */}
          {fileInputRef.current?.files?.[0] && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="lg"
              className="w-full max-w-xs"
            >
              {isUploading ? 'Uploading...' : 'Confirm Upload'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
