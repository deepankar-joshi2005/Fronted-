// Legacy types for backward compatibility
export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  userType: UserType;
  bucket: BucketType;
  url?: string;
  file?: File;
  uploadedAt: Date;
  updatedAt: Date;
  uploadedBy: string;
  tags?: string[];
  isActive: boolean;
}

// New types matching backend API
export interface ApiResource {
  _id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: UserType;
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

export type ResourceType = 'document' | 'video' | '3dmodel';
export type UserType = 'mentor' | 'student' | 'guest' | 'all';
export type BucketType = 'documents' | 'videos' | '3dmodels';

export interface DocumentResource extends Resource {
  type: 'document';
  bucket: 'documents';
  fileType: DocumentFileType;
  fileSize?: number;
  downloadCount?: number;
}

export interface VideoResource extends Resource {
  type: 'video';
  bucket: 'videos';
  videoType: VideoType;
  duration?: number;
  thumbnailUrl?: string;
  viewCount?: number;
}

export type DocumentFileType = 'pdf' | 'pptx' | 'xlsx' | 'docx' | 'link';
export type VideoType = 'mp4' | 'youtube' | 'vimeo' | 'external';

export interface ResourceBucket {
  type: BucketType;
  userType: UserType;
  resources: Resource[];
  totalCount: number;
}

export interface CreateResourceData {
  title: string;
  description?: string;
  type: ResourceType;
  userType: UserType;
  subject?: string;
  grade?: string;
  school?: string;
  module?: string;
  url?: string;
  file?: File;
  tags?: string[];
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  id: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  userType?: UserType;
  bucket?: BucketType;
  subject?: string;
  grade?: string;
  school?: string;
  module?: string;
  tags?: string[];
  search?: string;
}
