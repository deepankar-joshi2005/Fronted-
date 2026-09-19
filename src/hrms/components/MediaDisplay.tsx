import { getMediaUrl } from "@/utils/mediaUrl";

interface MediaDisplayProps {
  mediaPath: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

/**
 * Component for displaying uploaded media files (images, documents, etc.)
 * 
 * @example
 * // Display a school logo
 * <MediaDisplay 
 *   mediaPath={school.logo} 
 *   alt="School Logo" 
 *   className="w-20 h-20 object-contain" 
 * />
 * 
 * @example
 * // Display a contract document link
 * <MediaDisplay 
 *   mediaPath={school.contractDocument} 
 *   fallbackText="No contract uploaded" 
 * />
 */
export default function MediaDisplay({ 
  mediaPath, 
  alt = "Media file", 
  className = "", 
  fallbackText = "No media available" 
}: MediaDisplayProps) {
  const mediaUrl = getMediaUrl(mediaPath);

  if (!mediaUrl) {
    return <span className="text-gray-400">{fallbackText}</span>;
  }

  // Check if it's an image file
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(mediaPath || '');
  
  if (isImage) {
    return (
      <img 
        src={mediaUrl} 
        alt={alt} 
        className={className}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<span class="text-gray-400">${fallbackText}</span>`;
          }
        }}
      />
    );
  }

  // For non-image files, show a download link
  const fileName = mediaPath?.split('/').pop() || 'file';
  return (
    <a 
      href={mediaUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {fileName}
    </a>
  );
}
