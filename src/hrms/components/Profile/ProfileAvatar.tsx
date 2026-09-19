import { useState } from "react";
import ProfilePictureDisplay from "@/components/ProfilePictureDisplay";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface ProfileAvatarProps {
  profilePicture: string | null;
  name?: string | null;
  onUploaded?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

export default function ProfileAvatar({
  profilePicture,
  name,
  onUploaded,
  size = "md",
}: ProfileAvatarProps) {
  const [open, setOpen] = useState(false);

  const avatarSize = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative ${avatarSize} rounded-full overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        aria-label="Change profile picture"
      >
        <ProfilePictureDisplay profilePicture={profilePicture || undefined} name={name || undefined} size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 text-white text-xs">
            <Camera className={`${iconSize}`} />
            <span>Change</span>
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile picture</DialogTitle>
            <DialogDescription>
              Choose a new image. It will be resized to 180×180px and must be under 1MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <ProfilePictureDisplay profilePicture={profilePicture || undefined} name={name || undefined} size="lg" />
            </div>

            <ProfilePictureUpload
              currentProfilePicture={profilePicture || undefined}
              onUploadSuccess={(url) => {
                onUploaded?.(url);
                setOpen(false);
              }}
              size="md"
              showPreview={true}
            />

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


