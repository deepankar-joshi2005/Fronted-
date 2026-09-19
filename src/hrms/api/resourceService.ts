import axiosInstance from "./axiosInstance";

// Resource types matching backend
export interface Resource {
  _id: string;
  title: string;
  description: string;
  type: "document" | "video" | "3dmodel";
  category: "mentor" | "student" | "guest" | "all";
  content: {
    url: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    isExternal: boolean;
  };
  subject?: {
    _id: string;
    name: string;
  };
  grade?: string;
  school?: {
    _id: string;
    name: string;
    city: string;
    state: string;
  };
  module?: {
    _id: string;
    name: string;
  };
  session?: {
    _id: string;
    name: string;
    grade: number;
    sessionNumber: number;
    displayName?: string;
  };
  tags: string[];
  isPublic: boolean;
  isActive: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  viewCount: number;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  title: string;
  description?: string;
  type: "document" | "video" | "3dmodel";
  category: "mentor" | "student" | "guest" | "all";
  subject?: string;
  grade?: string;
  school?: string;
  module?: string;
  session?: string;
  tags?: string[];
  isPublic?: boolean;
  url?: string; // For external URLs
  file?: File; // For file uploads
}

export type UploadProgressCallback = (percent: number) => void;

export interface UpdateResourceData extends Partial<CreateResourceData> {}

export interface ResourceFilters {
  type?: "document" | "video" | "3dmodel";
  category?: "mentor" | "student" | "guest" | "all";
  subject?: string;
  grade?: string;
  school?: string;
  module?: string;
  session?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ResourceResponse {
  success: boolean;
  data: Resource;
  message?: string;
}

export interface ResourceListResponse {
  success: boolean;
  data: Resource[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Resource API service
export const resourceService = {
  // Get all resources with filters
  getAll: async (
    filters: ResourceFilters = {}
  ): Promise<ResourceListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await axiosInstance.get(`/resources?${params.toString()}`);
    return response.data;
  },

  // Get resources by category
  getByCategory: async (
    category: "mentor" | "student" | "guest" | "all",
    filters: Omit<ResourceFilters, "category"> = {}
  ): Promise<ResourceListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await axiosInstance.get(
      `/resources/category/${category}?${params.toString()}`
    );
    return response.data;
  },

  // Get resource by ID
  getById: async (id: string): Promise<ResourceResponse> => {
    const response = await axiosInstance.get(`/resources/${id}`);
    return response.data;
  },

  // Create new resource
  create: async (
    data: CreateResourceData,
    onProgress?: UploadProgressCallback
  ): Promise<ResourceResponse> => {
    const formData = new FormData();

    // Add text fields
    formData.append("title", data.title);
    formData.append("type", data.type);
    formData.append("category", data.category);

    if (data.description) formData.append("description", data.description);
    if (data.subject) formData.append("subject", data.subject);
    if (data.grade) formData.append("grade", data.grade);
    if (data.school) formData.append("school", data.school);
    if (data.module) formData.append("module", data.module);
    if (data.session) formData.append("session", data.session);
    if (data.isPublic !== undefined)
      formData.append("isPublic", data.isPublic.toString());
    
    // Only add URL if no file is being uploaded
    if (data.url && !data.file) {
      formData.append("url", data.url);
    }

    // Add tags
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => formData.append("tags", tag));
    }

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await axiosInstance.post("/resources", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 1800000, // 30 minutes timeout for large files (500MB)
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Update resource
  update: async (
    id: string,
    data: UpdateResourceData
  ): Promise<ResourceResponse> => {
    const formData = new FormData();

    // Add text fields
    if (data.title) formData.append("title", data.title);
    if (data.type) formData.append("type", data.type);
    if (data.category) formData.append("category", data.category);
    if (data.description !== undefined)
      formData.append("description", data.description);
    if (data.subject !== undefined) formData.append("subject", data.subject);
    if (data.grade !== undefined) formData.append("grade", data.grade);
    if (data.school !== undefined) formData.append("school", data.school);
    if (data.module !== undefined) formData.append("module", data.module);
    if (data.session !== undefined) formData.append("session", data.session);
    if (data.isPublic !== undefined)
      formData.append("isPublic", data.isPublic.toString());
    if (data.url) formData.append("url", data.url);

    // Add tags
    if (data.tags) {
      data.tags.forEach((tag) => formData.append("tags", tag));
    }

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await axiosInstance.put(`/resources/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 1800000, // 30 minutes timeout for large files (500MB)
      onUploadProgress: () => {},
    });
    return response.data;
  },

  // Delete resource
  delete: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/resources/${id}`);
    return response.data;
  },

  // Get resource URL for display
  getResourceUrl: (resource: Resource): string => {
    if (resource.content.isExternal) {
      return resource.content.url;
    }
    // For internal files, prepend the API base URL
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    const backendBaseUrl = baseUrl.replace("/api", "");
    return `${backendBaseUrl}${resource.content.url}`;
  },

  // Get iframe URL for videos
  getIframeUrl: (resource: Resource): string => {
    if (resource.type !== "video") {
      return resource.content.url;
    }

    const url = resource.content.url;

    // Handle YouTube URLs
    if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
      const videoId = url.includes("youtu.be/")
        ? url.split("youtu.be/")[1].split("?")[0]
        : url.split("v=")[1].split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Handle Vimeo URLs
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1].split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // For other video URLs or direct file URLs, return as is
    return url;
  },

  // Get file download URL
  getDownloadUrl: (resource: Resource): string => {
    if (resource.content.isExternal) {
      return resource.content.url;
    }
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    const backendBaseUrl = baseUrl.replace("/api", "");
    return `${backendBaseUrl}${resource.content.url}`;
  },
};
