import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { type SchoolHead } from "@/api/schoolService";

interface SchoolHeadFormProps {
  schoolHeads: SchoolHead[];
  onChange: (schoolHeads: SchoolHead[]) => void;
}

export default function SchoolHeadForm({ schoolHeads, onChange }: SchoolHeadFormProps) {
  const [profilePicFiles, setProfilePicFiles] = useState<{ [key: number]: File | null }>({});

  const addSchoolHead = () => {
    const newHead: SchoolHead = {
      name: "",
      designation: "",
      email: "",
      phoneNumber: "",
      profilePic: "",
    };
    onChange([...schoolHeads, newHead]);
  };

  const removeSchoolHead = (index: number) => {
    const updatedHeads = schoolHeads.filter((_, i) => i !== index);
    onChange(updatedHeads);
    
    // Remove profile pic file if exists
    const newProfilePicFiles = { ...profilePicFiles };
    delete newProfilePicFiles[index];
    setProfilePicFiles(newProfilePicFiles);
  };

  const updateSchoolHead = (index: number, field: keyof SchoolHead, value: string) => {
    const updatedHeads = [...schoolHeads];
    updatedHeads[index] = { ...updatedHeads[index], [field]: value };
    onChange(updatedHeads);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">School Heads</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSchoolHead}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add School Head
        </Button>
      </div>

      {schoolHeads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No school heads added yet.</p>
          <p className="text-sm">Click "Add School Head" to get started.</p>
        </div>
      )}

      {schoolHeads.map((head, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">School Head #{index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSchoolHead(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`head-name-${index}`}>Name *</Label>
                <Input
                  id={`head-name-${index}`}
                  value={head.name}
                  onChange={(e) => updateSchoolHead(index, 'name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`head-designation-${index}`}>Designation *</Label>
                <Input
                  id={`head-designation-${index}`}
                  value={head.designation}
                  onChange={(e) => updateSchoolHead(index, 'designation', e.target.value)}
                  placeholder="e.g., Principal, Vice Principal"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`head-email-${index}`}>Email ID *</Label>
                <Input
                  id={`head-email-${index}`}
                  type="email"
                  value={head.email}
                  onChange={(e) => updateSchoolHead(index, 'email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`head-phone-${index}`}>Phone Number *</Label>
                <Input
                  id={`head-phone-${index}`}
                  type="tel"
                  value={head.phoneNumber}
                  onChange={(e) => updateSchoolHead(index, 'phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor={`head-profile-${index}`}>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <input
                  id={`head-profile-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleProfilePicUpload(index, e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`head-profile-${index}`)?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                {profilePicFiles[index] && (
                  <span className="text-sm text-green-600">
                    {profilePicFiles[index]?.name}
                  </span>
                )}
                {head.profilePic && !profilePicFiles[index] && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-600">Photo uploaded</span>
                    {typeof head.profilePic === 'string' && head.profilePic.startsWith('/uploads/') && (
                      <a 
                        href={getMediaUrl(head.profilePic) || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 underline hover:text-blue-800"
                      >
                        View
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div> */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
