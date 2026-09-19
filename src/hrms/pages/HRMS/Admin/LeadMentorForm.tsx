/** @format */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Shield } from "lucide-react";
import {
  leadMentorService,
  type CreateLeadMentorData,
} from "@/api/leadMentorService";
import { schoolService, type School } from "@/api/schoolService";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
} from "@/constants/permissions";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "@/utils/validation";

interface LeadMentorFormProps {
  onSuccess?: () => void;
}

export function LeadMentorForm({
  onSuccess,
}: LeadMentorFormProps) {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  const [formData, setFormData] = useState<CreateLeadMentorData>({
    name: "",
    email: "",
    phoneNumber: "",
    assignedSchools: [],
    hasAccessToAllSchools: false,
    permissions: [],
  });

  const [creationMethod, setCreationMethod] = useState<
    "invite" | "credentials"
  >("invite");
  const [password, setPassword] = useState("");

  /* ================= FETCH SCHOOLS ================= */
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAll();
      if (response.success) {
        setSchools(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch schools");
    } finally {
      setSchoolsLoading(false);
    }
  };

  /* ================= HANDLERS ================= */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSchoolToggle = (schoolId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedSchools: prev.assignedSchools?.includes(schoolId)
        ? prev.assignedSchools.filter((id) => id !== schoolId)
        : [...(prev.assignedSchools || []), schoolId],
    }));
  };

  const handleAllSchoolsToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hasAccessToAllSchools: checked,
      assignedSchools: checked ? [] : prev.assignedSchools,
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions?.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...(prev.permissions || []), permission],
    }));
  };

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: Object.values(PERMISSIONS),
    }));
  };

  const handleClearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        createWithCredentials: creationMethod === "credentials",
        password: creationMethod === "credentials" ? password : undefined,
      };

      const response = await leadMentorService.create(submitData);

      if (response.success) {
        toast.success(response.message || "Lead mentor created successfully");
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create lead mentor"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Card className="max-w-2xl">
   
        <CardHeader>
          <CardTitle>Create Lead Mentor</CardTitle>
        </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <PhoneInput
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, phoneNumber: value }))
            }
            required
          />

          {/* ACCOUNT CREATION */}
          <div className="space-y-3">
            <Label>Account Creation Method *</Label>
            <RadioGroup
              value={creationMethod}
              onValueChange={(v) =>
                setCreationMethod(v as "invite" | "credentials")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="invite" />
                <Label>Email Invitation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credentials" />
                <Label>Manual Credentials</Label>
              </div>
            </RadioGroup>
          </div>

          {creationMethod === "credentials" && (
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {/* SCHOOL ACCESS */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              School Access
            </Label>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hasAccessToAllSchools}
                onChange={(e) => handleAllSchoolsToggle(e.target.checked)}
              />
              <span>Access all schools</span>
            </div>

            {!formData.hasAccessToAllSchools && (
              <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-2">
                {schoolsLoading ? (
                  <p className="text-sm text-gray-500">Loading schools...</p>
                ) : (
                  schools.map((school) => (
                    <label
                      key={school._id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.assignedSchools?.includes(school._id) ||
                          false
                        }
                        onChange={() => handleSchoolToggle(school._id)}
                      />
                      {school.name}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* PERMISSIONS */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions
              </Label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllPermissions}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClearAllPermissions}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="border rounded p-3 space-y-3">
              {Object.values(PERMISSIONS).map((permission) => (
                <label key={permission} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={formData.permissions?.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                  />
                  <div>
                    <p className="font-medium">
                      {
                        PERMISSION_LABELS[
                          permission as keyof typeof PERMISSION_LABELS
                        ]
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {
                        PERMISSION_DESCRIPTIONS[
                          permission as keyof typeof PERMISSION_DESCRIPTIONS
                        ]
                      }
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={
                loading ||
                schoolsLoading ||
                (creationMethod === "credentials" && !password)
              }
            >
              {loading
                ? "Saving..."
                : creationMethod === "invite"
                ? "Send Invitation"
                : "Create Lead Mentor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
