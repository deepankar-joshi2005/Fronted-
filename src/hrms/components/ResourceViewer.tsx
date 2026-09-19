import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Video,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { Resource as ApiResource } from '@/api/resourceService';
import { resourceService } from '@/api/resourceService';
import { getResourceDisplayUrl, getVideoIframeUrl, getFileTypeBadgeColor, formatFileSize } from '@/utils/resourceUtils';

interface ResourceViewerProps {
  resource: ApiResource;
  onClose?: () => void;
  showFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function ResourceViewer({ 
  resource, 
  onClose, 
  showFullscreen = false,
  onToggleFullscreen 
}: ResourceViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load resource');
  };

  const handleDownload = () => {
    const downloadUrl = resourceService.getDownloadUrl(resource);
    window.open(downloadUrl, '_blank');
  };

  const handleExternalOpen = () => {
    const displayUrl = getResourceDisplayUrl(resource);
    window.open(displayUrl, '_blank');
  };

  const getFileTypeBadge = () => {
    const extension = resource.content.fileName?.split('.').pop()?.toLowerCase() || '';
    const colorClass = getFileTypeBadgeColor(resource);
    
    switch (extension) {
      case 'pdf':
        return <Badge className={colorClass}>PDF</Badge>;
      case 'doc':
      case 'docx':
        return <Badge className={colorClass}>Word</Badge>;
      case 'xls':
      case 'xlsx':
        return <Badge className={colorClass}>Excel</Badge>;
      case 'ppt':
      case 'pptx':
        return <Badge className={colorClass}>PowerPoint</Badge>;
      case 'mp4':
        return <Badge className={colorClass}>MP4</Badge>;
      default:
        return <Badge className={colorClass}>{extension.toUpperCase()}</Badge>;
    }
  };

  const renderContent = () => {
    if (resource.type === 'video') {
      const iframeUrl = getVideoIframeUrl(resource);
      return (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Video className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Loading video...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Video className="h-12 w-12 mx-auto mb-2 text-red-400" />
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExternalOpen}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={resource.title}
          />
        </div>
      );
    } else {
      // Document viewer
      const displayUrl = getResourceDisplayUrl(resource);
      return (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Loading document...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 text-red-400" />
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExternalOpen}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          )}
          <iframe
            src={displayUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={resource.title}
          />
        </div>
      );
    }
  };

  return (
    <div className={`${showFullscreen ? 'fixed inset-0 z-50 bg-white' : 'w-full h-full'}`}>
      <Card className={`${showFullscreen ? 'h-full' : 'h-full'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            {resource.type === 'video' ? (
              <Video className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            <div>
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getFileTypeBadge()}
                <span className="text-sm text-gray-500">
                  {resource.content.fileSize && formatFileSize(resource.content.fileSize)}
                </span>
                <span className="text-sm text-gray-500">
                  {resource.viewCount} views
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFullscreen}
              >
                {showFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExternalOpen}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <div className="h-full">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
