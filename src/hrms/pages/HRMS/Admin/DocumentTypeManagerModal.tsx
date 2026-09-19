/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { X, Plus, Pencil, Trash2, FileType2, Check } from "lucide-react";
import { toast } from "../Alert/Toast";

const API_BASE = import.meta.env.VITE_API_URL;

export interface DocumentTypeItem {
  _id: string;
  key: string;
  label: string;
  description?: string;
}

export default function DocumentTypeManagerModal({
  open,
  onClose,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  onChange: () => void;
}) {
  const token = localStorage.getItem("token");

  const [types, setTypes] = useState<DocumentTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/document-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTypes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to load document types" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchTypes();
  }, [open]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setLabel("");
    setDescription("");
  };

  const startAdd = () => {
    setEditingId(null);
    setLabel("");
    setDescription("");
    setShowForm(true);
  };

  const startEdit = (t: DocumentTypeItem) => {
    setEditingId(t._id);
    setLabel(t.label);
    setDescription(t.description || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      toast({ type: "error", title: "Validation Error", message: "Document name is required" });
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await axios.put(
          `${API_BASE}/document-types/${editingId}`,
          { label: label.trim(), description: description.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ type: "success", title: "Updated", message: "Document type updated successfully." });
      } else {
        await axios.post(
          `${API_BASE}/document-types`,
          { label: label.trim(), description: description.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ type: "success", title: "Added", message: "Document type added successfully." });
      }
      resetForm();
      await fetchTypes();
      onChange();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Save Failed",
        message: error?.response?.data?.message || "Unable to save document type.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE}/document-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ type: "success", title: "Deleted", message: "Document type deleted." });
      setConfirmDeleteId(null);
      await fetchTypes();
      onChange();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message: error?.response?.data?.message || "Unable to delete document type.",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <FileType2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage Document Types</h2>
              <p className="text-xs text-gray-500">Configure the documents your employees must upload</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* ADD / EDIT FORM */}
          {showForm ? (
            <div className="border border-orange-200 bg-orange-50/40 rounded-xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Document Name *</label>
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Aadhaar Card"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short instructions shown to the employee"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="px-3 py-1.5 text-xs font-semibold border rounded-lg hover:bg-white text-gray-600"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <Check size={13} /> {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startAdd}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-200 text-orange-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-50 transition-colors"
            >
              <Plus size={15} /> Add New Document Type
            </button>
          )}

          {/* LIST */}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : types.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No document types configured yet.</p>
          ) : (
            <div className="space-y-2">
              {types.map((t) => (
                <div key={t._id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.label}</p>
                    {t.description && <p className="text-xs text-gray-400 truncate">{t.description}</p>}
                  </div>

                  {confirmDeleteId === t._id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500">Delete?</span>
                      <button
                        disabled={deleting}
                        onClick={() => handleDelete(t._id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border hover:bg-gray-50 text-gray-600"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(t._id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
