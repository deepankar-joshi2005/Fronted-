import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, Video, Link, Box } from 'lucide-react';
import { toast } from 'sonner';
import { resourceService, type CreateResourceData } from '@/api/resourceService';
import { moduleService, type Module } from '@/api/moduleService';
import { schoolService } from '@/api/schoolService';
import { usePaginatedSelect } from '@/hooks/usePaginatedSelect';
import { Loader2 } from 'lucide-react';

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['document', 'video', '3dmodel']),
  category: z.enum(['mentor', 'student']),
  subject: z.string().optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  url: z.string().optional(),
});


interface ResourceFormProps {
  resource?: any; // ApiResource type
  onSuccess?: () => void;
  onCancel?: () => void;
}

const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
];

export default function ResourceForm({ resource, onSuccess, onCancel }: ResourceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputTags, setInputTags] = useState('');
  const [subjects, setSubjects] = useState<Module[]>([]);
  const [isExternal, setIsExternal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || '',
      description: resource?.description || '',
      type: resource?.type || 'document',
      category: resource?.category || 'student',
      subject: resource?.subject?._id || '',
      grade: resource?.grade || '',
      school: resource?.school?._id || '',
      tags: resource?.tags || [],
      isPublic: resource?.isPublic ?? true,
      url: resource?.content?.url || '',
    },
  });

  const watchedType = watch('type');
  const watchedCategory = watch('category');

  // Load subjects
  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsData = await moduleService.getAllModules();
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  // Load schools with pagination
  const loadSchools = async (page: number, limit: number) => {
    try {
      const response = await schoolService.getAll({ page, limit });
      return response;
    } catch (error) {
      console.error('Error loading schools:', error);
      return { success: false, data: [], pagination: undefined };
    }
  };

  const {
    items: paginatedSchools,
    loading: schoolsLoading,
    hasMore: hasMoreSchools,
    loadMore: loadMoreSchools,
  } = usePaginatedSelect({
    fetchFunction: loadSchools,
    limit: 20,
  });

  // Set external URL mode based on existing resource
  useEffect(() => {
    if (resource?.content?.isExternal) {
      setIsExternal(true);
    }
  }, [resource]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsExternal(false);
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTags(e.target.value);
  };

  const addTag = () => {
    const tag = inputTags.trim();
    if (tag) {
      const currentTags = watch('tags') || [];
      if (!currentTags.includes(tag)) {
        setValue('tags', [...currentTags, tag]);
        setInputTags('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter((tag: string) => tag !== tagToRemove));
  };

  const onSubmit = async (data: any): Promise<void> => {
    setIsSubmitting(true);
    try {
      const formData: CreateResourceData = {
        ...data,
        file: selectedFile || undefined,
        tags: data.tags || [],
      };

      if (resource) {
        // Update existing resource
        await resourceService.update(resource._id, formData);
        toast.success('Resource updated successfully');
      } else {
        // Create new resource
        await resourceService.create(formData);
        toast.success('Resource created successfully');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalToggle = () => {
    setIsExternal(!isExternal);
    if (!isExternal) {
      setSelectedFile(null);
    } else {
      setValue('url', '');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {resource ? 'Edit Resource' : 'Add New Resource'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter resource title"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter resource description"
              rows={3}
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue('type', value as 'document' | 'video' | '3dmodel')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="3dmodel">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4" />
                      3D Model
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watchedCategory}
                onValueChange={(value) => setValue('category', value as 'mentor' | 'student')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject and Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={watch('subject')}
                onValueChange={(value) => setValue('subject', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject._id} value={subject._id || ''}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={watch('grade')}
                onValueChange={(value) => setValue('grade', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* School */}
          <div>
            <Label htmlFor="school">School</Label>
            <Select
              value={watch('school')}
              onValueChange={(value) => setValue('school', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select school" />
              </SelectTrigger>
              <SelectContent>
                {paginatedSchools.map((school) => (
                  <SelectItem key={school._id} value={school._id}>
                    {school.name} - {school.city}, {school.state}
                  </SelectItem>
                ))}
                {hasMoreSchools && (
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!schoolsLoading && hasMoreSchools) {
                        loadMoreSchools();
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-center w-full py-2">
                      {schoolsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More Schools"
                      )}
                    </div>
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload or External URL */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Button
                type="button"
                variant={!isExternal ? "default" : "outline"}
                onClick={() => handleExternalToggle()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <Button
                type="button"
                variant={isExternal ? "default" : "outline"}
                onClick={() => handleExternalToggle()}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                External URL
              </Button>
            </div>

            {!isExternal ? (
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={watchedType === 'video' 
                    ? 'video/mp4,video/avi,video/mov,video/wmv,video/webm'
                    : watchedType === '3dmodel'
                    ? '.glb,.gltf'
                    : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                  }
                />
                {selectedFile && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    {selectedFile.size > 200 * 1024 * 1024 && (
                      <p className="text-amber-600 mt-1">
                        ⚠️ Large file detected. Upload may take longer and could fail on some servers.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="url">External URL *</Label>
                <Input
                  id="url"
                  {...register('url')}
                  placeholder="Enter external URL (YouTube, Vimeo, etc.)"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={inputTags}
                onChange={handleTagsChange}
                placeholder="Enter tag and press Add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(watch('tags') || []).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Public/Private */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              className="rounded"
            />
            <Label htmlFor="isPublic">Make this resource public</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : (resource ? 'Update Resource' : 'Create Resource')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
