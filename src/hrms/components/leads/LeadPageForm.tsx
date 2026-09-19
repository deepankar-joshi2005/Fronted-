import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@/api/axiosInstance";
import { type Lead } from "@/api/leadService";
import { isValidPhoneNumber, getPhoneNumberError } from "@/utils/validation";
import StateDistrictSelector from "@/components/StateDistrictSelector";
import { REQUIRED_LABEL_CLASS } from "@/constants/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
const REQUIRED_FIELDS = new Set([
  "schoolName",
  "postalAddress",
  "city",
  "state",
  "district",
  "pinCode",
  "salesExecutive",
  "leadSource",
  "phase",
  "salesCycle",
  "actionNeeded",
  "actionOn",
  "actionDueDate",
]);
const getLabelClassName = (field: string, base?: string) =>
  [base, REQUIRED_FIELDS.has(field) ? REQUIRED_LABEL_CLASS : ""]
    .filter(Boolean)
    .join(" ");

type SalesManager = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
};
type SalesExecutive = { _id: string; name: string; email: string,isActive:boolean };

interface LeadPageFormProps {
  lead?: Lead | null;
  saving?: boolean;
  onCancel: () => void;
  readOnly?: boolean;
  onSubmit?: (payload: any) => Promise<void> | void;
}


export default function LeadPageForm({
  lead,
  saving = false,
  onCancel,
  readOnly = false,
  onSubmit,
}: LeadPageFormProps) {
  const isEdit = Boolean(lead?._id);
  const [managers, setManagers] = useState<SalesManager[]>([]);
  const [executives, setExecutives] = useState<SalesExecutive[]>([]);
  const [principalPhoneError, setPrincipalPhoneError] = useState<string | null>(
    null
  );
  const [keyPersonPhoneError, setKeyPersonPhoneError] = useState<string | null>(
    null
  );
  const [openDatePopovers, setOpenDatePopovers] = useState<
    Record<string, boolean>
  >({});
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [editingRemark, setEditingRemark] = useState<any>(null);
  const [editedText, setEditedText] = useState("");

  const startEditRemark = (remark: any) => {
    setEditingRemark(remark);
    setEditedText(remark.text);
  };

  const [form, setForm] = useState<any>({
    schoolName: "",
    postalAddress: "",
    city: "",
    state: "",
    district: "",
    stateId: "",
    districtId: "",
    pinCode: "",
    boardAffiliated: "CBSE",
    principalName: "",
    principalContact: "",
    principalEmail: "",
    schoolEmail: "",
    schoolWebsite: "",
    keyPersonName: "",
    keyPersonContact: "",
    keyPersonEmail: "",
    roboticsAtlPresent: "No",
    noOfStudents: "",
    avgFeesPerYear: "",
    qualified: "No",
    salesExecutive: "none",
    salesManager: "none",
    leadSource: "Internal",
    leadRemarks: [],
    newRemark: "",
    phase: "Lead",
    programType: "Pilot",
    qualityOfLead: "Cold",
    deliveryModel: "TPA Managed",
    salesStartDate: "",
    salesClosedDate: "",
    salesCycle: "2025-2026",
    teamRemarks: "",
    actionNeeded: "",
    actionOn: "",
    actionDueDate: "",
    annualContractValue: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [mgrRes, execRes] = await Promise.all([
          axiosInstance.get("/sales/managers"),
          axiosInstance.get("/sales/executives"),
        ]);
        setManagers(mgrRes.data.data || []);
        setExecutives(execRes.data.data || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!lead) return;
    setForm((prev: any) => ({
      ...prev,
      ...lead,
      leadRemarks: lead.leadRemarks || [],
      newRemark: "",
      noOfStudents: lead.noOfStudents ?? "",
      avgFeesPerYear: lead.avgFeesPerYear ?? "",
      annualContractValue: lead.annualContractValue ?? "",
      salesStartDate: lead.salesStartDate
        ? lead.salesStartDate.substring(0, 10)
        : "",
      salesClosedDate: lead.salesClosedDate
        ? lead.salesClosedDate.substring(0, 10)
        : "",
      actionDueDate: lead.actionDueDate
        ? lead.actionDueDate.substring(0, 10)
        : "",
      salesExecutive:
        (lead as any).salesExecutive &&
        typeof (lead as any).salesExecutive === "object" &&
        "_id" in (lead as any).salesExecutive
          ? (lead as any).salesExecutive._id
          : typeof (lead as any).salesExecutive === "string" &&
            (lead as any).salesExecutive
          ? (lead as any).salesExecutive
          : "none",
      salesManager:
        (lead as any).salesManager &&
        typeof (lead as any).salesManager === "object" &&
        "_id" in (lead as any).salesManager
          ? (lead as any).salesManager._id
          : typeof (lead as any).salesManager === "string" &&
            (lead as any).salesManager
          ? (lead as any).salesManager
          : "none",
      // Handle actionOn: if it's an object (populated), extract _id; otherwise use as is
      actionOn:
        lead.actionOn &&
        typeof lead.actionOn === "object" &&
        "_id" in lead.actionOn &&
        "name" in lead.actionOn
          ? lead.actionOn._id
          : typeof lead.actionOn === "string"
          ? lead.actionOn
          : "none",
    }));
  }, [lead?._id]);

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  console.log("isSuperAdmin",isSuperAdmin);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
    if (name === "principalContact") {
      setPrincipalPhoneError(getPhoneNumberError(value));
    }
    if (name === "keyPersonContact") {
      setKeyPersonPhoneError(getPhoneNumberError(value));
    }
  };
  const handleSelect = (name: string, value: string) =>
    setForm((p: any) => ({ ...p, [name]: value }));

  const isEmail = (v: string) =>
    /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-])+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(
      v
    );
  const isUrl = (v: string) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  };
  const isDigits = (v: string, len?: number) =>
    /^\d+$/.test(v) && (len ? v.length === len : true);

  const submit = async () => {
      if (readOnly) return;
        if (!onSubmit) {
          console.warn("onSubmit is not provided");
          return;
        }

    if (!form.schoolName?.trim()) {
      alert("School Name is required");
      return;
    }
    if (form.principalEmail && !isEmail(form.principalEmail)) {
      alert("Enter a valid Principal Email");
      return;
    }
    if (form.schoolEmail && !isEmail(form.schoolEmail)) {
      alert("Enter a valid School Email");
      return;
    }
    if (form.keyPersonEmail && !isEmail(form.keyPersonEmail)) {
      alert("Enter a valid Key Person Email");
      return;
    }
    if (form.schoolWebsite && !isUrl(form.schoolWebsite)) {
      alert("Enter a valid School Website URL");
      return;
    }
    if (form.pinCode && !isDigits(form.pinCode, 6)) {
      alert("PIN Code must be 6 digits");
      return;
    }
    if (form.principalContact && !isValidPhoneNumber(form.principalContact)) {
      alert("Please enter a valid Principal Contact number");
      return;
    }
    if (form.keyPersonContact && !isValidPhoneNumber(form.keyPersonContact)) {
      alert("Please enter a valid Key Person Contact number");
      return;
    }
    if (form.noOfStudents && Number(form.noOfStudents) < 0) {
      alert("No of Students cannot be negative");
      return;
    }
    if (form.avgFeesPerYear && Number(form.avgFeesPerYear) < 0) {
      alert("Avg Fees cannot be negative");
      return;
    }
    if (form.annualContractValue && Number(form.annualContractValue) < 0) {
      alert("Annual Contract Value cannot be negative");
      return;
    }
    if (
      form.salesStartDate &&
      form.salesClosedDate &&
      new Date(form.salesStartDate) > new Date(form.salesClosedDate)
    ) {
      alert("Sales Closed Date cannot be before Sales Start Date");
      return;
    }
    const payload: any = {
      ...form,
      // Include leadRemarks for new leads, but exclude for updates (handled separately via API)
      leadRemarks: isEdit ? undefined : (form.leadRemarks || []).map((r: any) => ({
        text: r.text,
        createdBy: r.createdBy?._id || r.createdBy,
        createdAt: r.createdAt,
      })),
      noOfStudents: form.noOfStudents ? Number(form.noOfStudents) : null,
      avgFeesPerYear: form.avgFeesPerYear ? Number(form.avgFeesPerYear) : null,
      annualContractValue: form.annualContractValue
        ? Number(form.annualContractValue)
        : null,
      salesStartDate: form.salesStartDate || null,
      salesClosedDate: form.salesClosedDate || null,
      actionDueDate: form.actionDueDate || null,
    };
    if (payload.actionOn === "none") payload.actionOn = null;
    if (payload.salesExecutive === "none") payload.salesExecutive = null;
    if (payload.salesManager === "none") payload.salesManager = null;
    if (payload.district && !payload.city) {
      payload.city = payload.district;
    }
    delete payload.stateId;
    delete payload.districtId;
    await onSubmit(payload);
  };

  const latestRemark =
  form.leadRemarks && form.leadRemarks.length > 0
    ? form.leadRemarks[form.leadRemarks.length - 1]
    : null;

  const dateField = (label: string, name: string) => {
    const formatDateToLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return (
      <div className="space-y-2">
        <Popover
          open={openDatePopovers[name] || false}
          onOpenChange={(open) =>
            setOpenDatePopovers((prev) => ({ ...prev, [name]: open }))
          }
        >
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {form[name]
                ? format(new Date(form[name]), "PPP")
                : `Pick ${label}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 bg-card border border-[var(--border)]">
            <Calendar
              mode="single"
              selected={form[name] ? new Date(form[name]) : undefined}
              onSelect={(d: any) => {
                handleSelect(name, d ? formatDateToLocal(d) : "");
                setOpenDatePopovers((prev) => ({ ...prev, [name]: false }));
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };
  const handleAddRemark = async () => {
    if (!form.newRemark.trim()) return;

    // If editing an existing lead, call the API
    if (lead?._id) {
      try {
        const res = await axiosInstance.post(
          `/leads/${lead._id}/remarks`,
          { text: form.newRemark }
        );
        
        // backend updated remarks return karega (best)
        setForm((prev: any) => ({
          ...prev,
          leadRemarks: res.data.data.leadRemarks,
          newRemark: "",
        }));
      } catch (err) {
        alert("Failed to add remark");
      }
    } else {
      // If creating a new lead, add remark to local state
      const newRemark = {
        _id: `temp-${Date.now()}`,
        text: form.newRemark.trim(),
        createdBy: user ? { _id: user.id, name: user.name, email: user.email } : null,
        createdAt: new Date(),
      };
      
      setForm((prev: any) => ({
        ...prev,
        leadRemarks: [...(prev.leadRemarks || []), newRemark],
        newRemark: "",
      }));
    }
  };

  const saveEditedRemark = async () => {
    if (!editingRemark || !lead?._id) return;

    try {
      const res = await axiosInstance.put(
        `/leads/${lead._id}/remarks/${editingRemark._id}`,
        { text: editedText }
      );

      setForm((prev: any) => ({
        ...prev,
        leadRemarks: res.data.data.leadRemarks,
      }));

      setEditingRemark(null);
    } catch {
      alert("Failed to update remark");
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={readOnly ? "pointer-events-none opacity-90" : ""}>
          <h1 className="text-2xl font-semibold">
            {readOnly
              ? `View Lead ${lead?.leadNo}`
              : isEdit
              ? `Edit Lead ${lead?.leadNo}`
              : "Create Lead"}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Fill the details below.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>School Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={getLabelClassName("schoolName")}>
                    School Name
                  </Label>
                  <Input
                    name="schoolName"
                    placeholder="e.g. Springfield High School"
                    value={form.schoolName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className={getLabelClassName("postalAddress")}>
                    Postal Address
                  </Label>
                  <Input
                    name="postalAddress"
                    placeholder="Street, Area, Landmark"
                    value={form.postalAddress}
                    onChange={handleChange}
                  />
                </div>
                <StateDistrictSelector
                  selectedStateId={form.stateId}
                  selectedStateName={form.state}
                  selectedDistrictId={form.districtId}
                  selectedDistrictName={form.district}
                  required
                  stateLabelClassName={getLabelClassName("state")}
                  districtLabelClassName={getLabelClassName("district")}
                  onStateChange={(state) =>
                    setForm((prev: any) => ({
                      ...prev,
                      state: state?.name ?? "",
                      stateId: state?.id ?? "",
                      district: "",
                      districtId: "",
                      city: "",
                    }))
                  }
                  onDistrictChange={(district) =>
                    setForm((prev: any) => ({
                      ...prev,
                      district: district?.name ?? "",
                      districtId: district?.id ?? "",
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={getLabelClassName("city")}>
                      City / Town
                    </Label>
                    <Input
                      name="city"
                      placeholder="e.g. Bengaluru"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={getLabelClassName("pinCode")}>
                      PIN Code
                    </Label>
                    <Input
                      name="pinCode"
                      placeholder="6-digit PIN"
                      inputMode="numeric"
                      pattern="\\d*"
                      value={form.pinCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Board Affiliated (Optional)
                    </Label>
                    <Select
                      value={form.boardAffiliated}
                      onValueChange={(v) => handleSelect("boardAffiliated", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Select board" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "CBSE",
                          "ICSE",
                          "State Board",
                          "IGCSE",
                          "IB",
                          "Other",
                        ].map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      School Website (Optional)
                    </Label>
                    <Input
                      name="schoolWebsite"
                      placeholder="https://example.edu"
                      type="url"
                      value={form.schoolWebsite}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Principal Name (Optional)
                    </Label>
                    <Input
                      name="principalName"
                      placeholder="e.g. Dr. A. Sharma"
                      value={form.principalName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Principal Contact (Optional)
                    </Label>
                    <Input
                      name="principalContact"
                      placeholder="e.g. +91 98xxxxxxx"
                      type="tel"
                      value={form.principalContact}
                      onChange={handleChange}
                      className={principalPhoneError ? "border-red-500" : ""}
                    />
                    {principalPhoneError && (
                      <p className="text-sm text-[var(--destructive)]">
                        {principalPhoneError}
                      </p>
                    )}
                    {!principalPhoneError && form.principalContact && (
                      <p className="text-xs text-green-600">
                        ✓ Valid phone number
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--muted-foreground)]">
                    Principal Email (Optional)
                  </Label>
                  <Input
                    name="principalEmail"
                    placeholder="principal@school.edu"
                    type="email"
                    value={form.principalEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--muted-foreground)]">
                    School Email (Optional)
                  </Label>
                  <Input
                    name="schoolEmail"
                    placeholder="info@school.edu"
                    type="email"
                    value={form.schoolEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Key Person Name (Optional)
                    </Label>
                    <Input
                      name="keyPersonName"
                      placeholder="e.g. Ms. K. Rao"
                      value={form.keyPersonName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Key Person Contact (Optional)
                    </Label>
                    <Input
                      name="keyPersonContact"
                      placeholder="e.g. +91 9xxxxxxxxx"
                      type="tel"
                      value={form.keyPersonContact}
                      onChange={handleChange}
                      className={keyPersonPhoneError ? "border-red-500" : ""}
                    />
                    {keyPersonPhoneError && (
                      <p className="text-sm text-[var(--destructive)]">
                        {keyPersonPhoneError}
                      </p>
                    )}
                    {!keyPersonPhoneError && form.keyPersonContact && (
                      <p className="text-xs text-green-600">
                        ✓ Valid phone number
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--muted-foreground)]">
                    Key Person Email (Optional)
                  </Label>
                  <Input
                    name="keyPersonEmail"
                    placeholder="key.person@school.edu"
                    type="email"
                    value={form.keyPersonEmail}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qualification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Robotics / ATL Present? (Optional)
                    </Label>
                    <Select
                      value={form.roboticsAtlPresent}
                      onValueChange={(v) =>
                        handleSelect("roboticsAtlPresent", v)
                      }
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Qualified? (Optional)
                    </Label>
                    <Select
                      value={form.qualified}
                      onValueChange={(v) => handleSelect("qualified", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Qualified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      No of Students (Optional)
                    </Label>
                    <Input
                      name="noOfStudents"
                      placeholder="e.g. 500"
                      type="number"
                      min="0"
                      value={form.noOfStudents}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Avg Fees Per Year (Optional)
                    </Label>
                    <Input
                      name="avgFeesPerYear"
                      placeholder="e.g. 45000"
                      type="number"
                      min="0"
                      value={form.avgFeesPerYear}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={getLabelClassName("salesExecutive")}>
                      TPA Sales POC (Executive)
                    </Label>
                    <Select
                      value={form.salesExecutive}
                      onValueChange={(v) => handleSelect("salesExecutive", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Select Executive" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {executives
                          .filter((e) => e.isActive === true)
                          .map((e) => (
                            <SelectItem key={e._id} value={e._id}>
                              {e.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>TPA Sales POC (Manager)</Label>
                    <Select
                      value={form.salesManager}
                      onValueChange={(v) => handleSelect("salesManager", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Select Manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>

                        {managers
                          .filter((m) => m.isActive === true)
                          .map((m) => (
                            <SelectItem key={m._id} value={m._id}>
                              {m.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={getLabelClassName("leadSource")}>
                      Lead Source
                    </Label>
                    <Select
                      value={form.leadSource}
                      onValueChange={(v) => handleSelect("leadSource", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Lead Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Internal">Internal</SelectItem>
                        <SelectItem value="Channel Partner">
                          Channel Partner
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={getLabelClassName("phase")}>Phase</Label>
                    <Select
                      value={form.phase}
                      onValueChange={(v) => handleSelect("phase", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Lead",
                          "Visit to be scheduled",
                          "Visited",
                          "Demo / PTM etc to be Scheduled",
                          "Proposal to be shared",
                          "Proposal Shared",
                          "Commercial Negotiations underway",
                          "Decision Awaited",
                          "LOI Awaited",
                          "LOI Received",
                          "Contract to be shared",
                          "Contract Shared",
                          "Contract Review underway",
                          "Contract Signed",
                          "Deal Lost",
                          "On Hold",
                          "Pursue next AY",
                          "Invoiced",
                          "Payment Awaited",
                          "Payment Received",
                          "Kits to be Shipped",
                          "Kits Shipped",
                          "Training to be Scheduled",
                          "Training Scheduled",
                          "Training Completed",
                          "Kickoff to be scheduded",
                          "Kickoff Complete",
                        ].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Pilot / Full Program (Optional)
                    </Label>
                    <Select
                      value={form.programType}
                      onValueChange={(v) => handleSelect("programType", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Program Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pilot">Pilot</SelectItem>
                        <SelectItem value="Full">Full</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Delivery Model (Optional)
                    </Label>
                    <Select
                      value={form.deliveryModel}
                      onValueChange={(v) => handleSelect("deliveryModel", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Delivery Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {["TPA Managed", "School Managed", "Hybrid"].map(
                          (d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500">
                      Quality Of Lead (Optional)
                    </Label>
                    <Select
                      value={form.qualityOfLead}
                      onValueChange={(v) => handleSelect("qualityOfLead", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cold">Cold</SelectItem>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className={getLabelClassName("salesCycle")}>
                      Sales Cycle
                    </Label>
                    <Select
                      value={form.salesCycle}
                      onValueChange={(v) => handleSelect("salesCycle", v)}
                    >
                      <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                        <SelectValue placeholder="Sales Cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        {["2025-2026", "2026-2027"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Sales Start Date (Optional)
                    </Label>
                    {dateField("Sales Start Date", "salesStartDate")}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[var(--muted-foreground)]">
                      Sales Closed Date (Optional)
                    </Label>
                    {dateField("Sales Closed Date", "salesClosedDate")}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[var(--muted-foreground)]">
                    Annual Contract Value (INR) (Optional)
                  </Label>
                  <Input
                    name="annualContractValue"
                    placeholder="e.g. 250000"
                    type="number"
                    min="0"
                    value={form.annualContractValue}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add New Remark</Label>
                  <Textarea
                    placeholder="Type a new remark..."
                    value={form.newRemark}
                    onChange={(e) =>
                      setForm((p: any) => ({ ...p, newRemark: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
                <Button
                  type="button"
                  disabled={!form.newRemark.trim()}
                  onClick={handleAddRemark}
                >
                  Add Remark
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="ml-2"
                  onClick={() => setRemarksOpen(true)}
                >
                  View All Remarks
                </Button>

                <div className="border rounded-md bg-muted p-3 space-y-3">
                  {/* 🔥 Latest Remark */}
                  {latestRemark ? (
                    <div>
                      <p className="text-sm">{latestRemark.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        — {latestRemark.createdBy?.name || "Unknown"} •{" "}
                        {new Date(latestRemark.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No remarks added yet
                    </p>
                  )}

                  {/* 🔒 Read-only Remarks Box */}
                  <Textarea
                    name="teamRemarks"
                    value={form.teamRemarks}
                    readOnly
                    className="
      bg-white
      resize-none
      max-h-40
      overflow-y-auto
      cursor-default
    "
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-2 col-span-2">
                    <Label className={getLabelClassName("actionNeeded")}>
                      Action needed - From Team
                    </Label>
                    <Input
                      name="actionNeeded"
                      placeholder="e.g. Call Principal for demo scheduling"
                      value={form.actionNeeded}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={getLabelClassName("actionDueDate")}>
                      Action Due date
                    </Label>
                    {dateField("Action Due date", "actionDueDate")}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className={getLabelClassName("actionOn")}>
                    Action On
                  </Label>
                  <Select
                    value={form.actionOn || "none"}
                    onValueChange={(v) => handleSelect("actionOn", v)}
                  >
                    <SelectTrigger className="bg-[var(--soft-engineering)] text-[var(--foreground)] border-[var(--border)]">
                      <SelectValue placeholder="Select Sales Manager or Executive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectGroup>
                        <SelectLabel>Managers</SelectLabel>
                        {managers.map((m) => (
                          <SelectItem key={`manager-${m._id}`} value={m._id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Executives</SelectLabel>
                        {executives.map((e) => (
                          <SelectItem key={`exec-${e._id}`} value={e._id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          {!readOnly && (
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Lead"}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={remarksOpen} onOpenChange={setRemarksOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>All Lead Remarks</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {form.leadRemarks.length === 0 && (
              <p className="text-sm text-muted-foreground">No remarks found</p>
            )}

            {form.leadRemarks.map((r: any, idx: number) => (
              <div
                key={idx}
                className="border rounded-md p-3 flex justify-between gap-3"
              >
                {/* Left content */}
                <div className="flex-1">
                  <p className="text-sm">{r.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.createdBy?.name || "Unknown"} •{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Right icon */}
                {isSuperAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8"
                    onClick={() => startEditRemark(r)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editingRemark}
        onOpenChange={() => setEditingRemark(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Remark</DialogTitle>
          </DialogHeader>

          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
          />

          <Button onClick={saveEditedRemark}>Save</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
