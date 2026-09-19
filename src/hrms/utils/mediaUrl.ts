/**
 * Helper function to construct full media URLs for uploaded files
 * 
 * This function takes a media path (usually starting with "/uploads/...") and constructs
 * the full URL by combining it with the backend base URL derived from VITE_API_URL.
 * 
 * @param mediaPath - The media path starting with "/uploads/..." (e.g., "/uploads/contracts/file.pdf")
 * @returns Full URL to access the media file (e.g., "http://localhost:8000/uploads/contracts/file.pdf")
 * 
 * @example
 * // For a contract document
 * const contractUrl = getMediaUrl("/uploads/contracts/abc123.pdf");
 * // Returns: "http://localhost:8000/uploads/contracts/abc123.pdf"
 * 
 * @example
 * // For a school logo
 * const logoUrl = getMediaUrl(school.logo);
 * // Returns: "http://localhost:8000/uploads/schools/logos/def456.jpg"
 * 
 * @example
 * // For a school head profile picture
 * const profileUrl = getMediaUrl(schoolHead.profilePic);
 * // Returns: "http://localhost:8000/uploads/schools/profile-pics/ghi789.png"
 */
export const getMediaUrl = (mediaPath: string | null | undefined): string | null => {
  if (!mediaPath) {
    return null;
  }

  // If the path is already a full URL, return as is
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }

  // Get the API URL from environment
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  
  // Remove the /api suffix to get the backend base URL
  const backendBaseUrl = apiUrl.replace('/api', '');
  
  // Ensure the media path starts with /
  const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  
  // Construct the full URL
  return `${backendBaseUrl}${normalizedPath}`;
};

/**
 * Helper function to get media URL with fallback
 * @param mediaPath - The media path starting with "/uploads/..."
 * @param fallback - Fallback URL if mediaPath is not available
 * @returns Full URL to access the media file or fallback
 */
export const getMediaUrlWithFallback = (
  mediaPath: string | null | undefined, 
  fallback: string
): string => {
  return getMediaUrl(mediaPath) || fallback;
};
