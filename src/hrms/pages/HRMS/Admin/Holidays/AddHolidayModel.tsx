import { useEffect, useState } from "react";
import axios from "axios";
import { X, Save } from "lucide-react";
import { toast } from "../../Alert/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Holiday {
  _id?: string;
  title: string;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  holiday: Holiday | null;
  onSuccess: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL;

const AddHolidayModal = ({
  isOpen,
  onClose,
  mode,
  holiday,
  onSuccess,
}: Props) => {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState<Holiday>({
    title: "",
    date: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && holiday) {
      setForm({
        title: holiday.title,
        date: holiday.date.split("T")[0],
      });
    } else {
      setForm({ title: "", date: "" });
    }

    setErrors({});
  }, [isOpen, mode, holiday]);

  if (!isOpen) return null;

  const validate = () => {
    const e: any = {};
    if (!form.title.trim()) e.title = "Holiday name is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);

      const res =
        mode === "add"
          ? await axios.post(`${API_BASE}/holidays`, form, {
            headers: { Authorization: `Bearer ${token}` },
          })
          : await axios.put(`${API_BASE}/holidays/${holiday?._id}`, form, {
            headers: { Authorization: `Bearer ${token}` },
          });

      toast({
        type: "success",
        title: mode === "add" ? "Holiday Added" : "Holiday Updated",
        message: res.data?.message || "Holiday record has been saved successfully.",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error",
        message: err?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* MODAL */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "add" ? "Add New Holiday" : "Edit Holiday"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Holiday Name *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New Year's Day"
              className={`rounded-md border-gray-300 focus:ring-orange-500 focus:border-orange-500 ${errors.title ? "border-red-500" : ""
                }`}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Holiday Date *
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={`rounded-md border-gray-300 focus:ring-orange-500 focus:border-orange-500 ${errors.date ? "border-red-500" : ""
                }`}
            />
            {errors.date && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.date}</p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading ? "Saving..." : (
                <div className="flex items-center gap-2">
                  <Save size={16} /> {mode === "add" ? "Save Holiday" : "Update Holiday"}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHolidayModal;
