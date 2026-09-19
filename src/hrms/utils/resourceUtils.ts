import type { Resource, ApiResource } from "@/types/resources";

// Convert API resource to legacy format for backward compatibility
export const convertApiResourceToLegacy = (
  apiResource: ApiResource
): Resource => {
  return {
    id: apiResource._id,
    title: apiResource.title,
    description: apiResource.description,
    type: apiResource.type,
    userType: apiResource.category,
    bucket: apiResource.type === "video" ? "videos" : "documents",
    url: apiResource.content.url,
    uploadedAt: new Date(apiResource.createdAt),
    updatedAt: new Date(apiResource.updatedAt),
    uploadedBy: apiResource.uploadedBy.name,
    tags: apiResource.tags,
    isActive: apiResource.isActive,
  };
};

// Convert legacy resource to API format
export const convertLegacyResourceToApi = (
  legacyResource: Resource
): Partial<ApiResource> => {
  return {
    title: legacyResource.title,
    description: legacyResource.description || "",
    type: legacyResource.type,
    category: legacyResource.userType,
    content: {
      url: legacyResource.url || "",
      isExternal: !!(
        legacyResource.url && legacyResource.url.startsWith("http")
      ),
    },
    tags: legacyResource.tags || [],
    isActive: legacyResource.isActive,
  };
};

// Get display URL for resource
export const getResourceDisplayUrl = (resource: ApiResource): string => {
  if (resource.content.isExternal) {
    return resource.content.url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  // Remove the /api suffix to get the backend base URL
  const backendBaseUrl = baseUrl.replace("/api", "");

  return `${backendBaseUrl}${resource.content.url}`;
};

// Get iframe URL for videos
export const getVideoIframeUrl = (resource: ApiResource): string => {
  if (resource.type !== "video") {
    return resource.content.url;
  }

  const url = resource.content.url;

  // Handle YouTube URLs along with Shorts
  if (
    url.includes("youtube.com/watch") ||
    url.includes("youtu.be/") ||
    url.includes("youtube.com/shorts")
  ) {
    let videoId = url.includes("youtu.be/")
      ? url.split("youtu.be/")[1].split("?")[0]
      : "";
    if (url.includes("youtube.com/shorts")) {
      videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
    } else {
      videoId = url.split("v=")[1].split("&")[0];
    }
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Handle Vimeo URLs
  if (url.includes("vimeo.com/")) {
    const videoId = url.split("vimeo.com/")[1].split("?")[0];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // For other video URLs or direct file URLs, return as is
  return url;
};

// Get file extension from URL or filename
export const getFileExtension = (resource: ApiResource): string => {
  if (resource.content.fileName) {
    return resource.content.fileName.split(".").pop()?.toLowerCase() || "";
  }

  const url = resource.content.url;
  if (url.includes(".")) {
    return url.split(".").pop()?.toLowerCase() || "";
  }

  return "";
};

// Get file type badge color
export const getFileTypeBadgeColor = (resource: ApiResource): string => {
  const extension = getFileExtension(resource);

  switch (extension) {
    case "pdf":
      return "bg-red-100 text-red-800";
    case "doc":
    case "docx":
      return "bg-blue-100 text-blue-800";
    case "xls":
    case "xlsx":
      return "bg-green-100 text-green-800";
    case "ppt":
    case "pptx":
      return "bg-orange-100 text-orange-800";
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "webm":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Format file size
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "";

  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

// Check if resource is external
export const isExternalResource = (resource: ApiResource): boolean => {
  return resource.content.isExternal;
};

// Get resource icon based on type and content
export const getResourceIcon = (resource: ApiResource): string => {
  if (resource.type === "video") {
    return "🎥";
  }

  const extension = getFileExtension(resource);

  switch (extension) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
      return "📝";
    case "xls":
    case "xlsx":
      return "📊";
    case "ppt":
    case "pptx":
      return "📽️";
    default:
      return "📁";
  }
};
