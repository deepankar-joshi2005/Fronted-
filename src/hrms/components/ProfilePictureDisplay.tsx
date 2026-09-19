import { User } from "lucide-react";

interface ProfilePictureDisplayProps {
  profilePicture?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

export default function ProfilePictureDisplay({
  profilePicture,
  name,
  size = "md",
  className = "",
  showFallback = true,
}: ProfilePictureDisplayProps) {
  // Container size is controlled by parent; icon scales via size prop

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  console.log({ profilePicture });

  return (
    <div
      className={`w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}
    >
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={name ? `${name}'s profile` : "Profile"}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log("error loading profile picture", e);
            // If image fails to load, show fallback
            if (showFallback) {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-gray-100">
                    ${
                      name
                        ? `<span class="text-gray-600 font-medium text-xs">${getInitials(
                            name
                          )}</span>`
                        : '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
                    }
                  </div>
                `;
              }
            }
          }}
        />
      ) : showFallback ? (
        name ? (
          <span className="text-gray-600 font-medium text-xs">
            {getInitials(name)}
          </span>
        ) : (
          <User className={`${iconSizes[size]} text-gray-400`} />
        )
      ) : null}
    </div>
  );
}
