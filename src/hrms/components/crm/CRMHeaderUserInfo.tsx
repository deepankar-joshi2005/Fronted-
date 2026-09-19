import { Badge } from "@/components/ui/badge";

type CRMHeaderUserInfoProps = {
  name?: string | null;
  role?: string | null;
};

const formatRoleLabel = (role?: string | null) => {
  if (!role) return null;

  return role
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export function CRMHeaderUserInfo({ name, role }: CRMHeaderUserInfoProps) {
  const roleLabel = formatRoleLabel(role);

  return (
    <div className="flex flex-wrap items-center gap-2 text-gray-900">
      <span className="text-lg sm:text-xl font-semibold">
        {name || "CRM Portal"}
      </span>
      {roleLabel && (
        <Badge
          variant="secondary"
          className="uppercase tracking-wide text-[11px] font-semibold bg-sky-100 text-sky-700 border-transparent"
        >
          {roleLabel}
        </Badge>
      )}
    </div>
  );
}

