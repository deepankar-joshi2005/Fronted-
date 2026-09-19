import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import ProfileAvatar from "@/components/Profile/ProfileAvatar";
import axiosInstance from "@/api/axiosInstance";

interface ProfileCardProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

export default function ProfileCard({
  children,
  title,
  description,
}: ProfileCardProps) {
  const { user } = useAuth();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  // kept for potential loading state usage when avatar mounts
  const [, setLoadingProfilePicture] = useState(true);

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      superadmin: "Super Admin",
      leadmentor: "Lead Mentor",
      schooladmin: "School Admin",
      mentor: "Employee",
      employee: "Employee",
      student: "Student",
      guest: "Guest",
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      superadmin: "bg-red-100 text-red-800 border-red-200",
      leadmentor: "bg-blue-100 text-blue-800 border-blue-200",
      schooladmin: "bg-green-100 text-green-800 border-green-200",
      mentor: "bg-purple-100 text-purple-800 border-purple-200",
      employee: "bg-purple-100 text-purple-800 border-purple-200",
      student: "bg-yellow-100 text-yellow-800 border-yellow-200",
      guest: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Fetch profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await axiosInstance.get("/profile-picture");
        if (response.data.success) {
          setProfilePicture(
            `${import.meta.env.VITE_API_URL.replace("/api", "")}${
              response.data.data.profilePicture
            }`
          );
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      } finally {
        setLoadingProfilePicture(false);
      }
    };

    fetchProfilePicture();
  }, []);

  const handleProfilePictureSuccess = (newProfilePicture: string) => {
    setProfilePicture(newProfilePicture);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Basic Information Card (first) */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title || "Profile Information"}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header row with avatar at right */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              {user.name && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{user.name}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResetPassword(true)}
                  className="w-full sm:w-auto"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>

            {/* Compact avatar with hover overlay to change */}
            <ProfileAvatar
              profilePicture={profilePicture}
              name={user.name}
              onUploaded={handleProfilePictureSuccess}
              size="lg"
            />
          </div>

          {/* Role-specific content */}
          {children}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        userId={user.id}
        userName={user.name || "User"}
        userEmail={user.email}
      />
    </div>
  );
}
