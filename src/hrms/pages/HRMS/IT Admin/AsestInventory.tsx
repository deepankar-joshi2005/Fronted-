/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Search,
  SlidersHorizontal,
  Boxes,
  CheckCircle2,
  Laptop,
  AlertTriangle,
} from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ---------------- TYPES ---------------- */
interface Asset {
  _id: string;
  assetType: string;
  serialNumber: string;
  warrantyExpiry: string;
  accessories: string[];
  status: "AVAILABLE" | "ASSIGNED";
}

type StatusFilter = "All" | "AVAILABLE" | "ASSIGNED";

/* ---------------- COMPONENT ---------------- */
export default function AssetInventory() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* form */
  const [form, setForm] = useState({
    assetType: "Laptop",
    serialNumber: "",
    warrantyExpiry: "",
    accessories: "",
    status: "AVAILABLE",
  });

  /* ---------------- FETCH ASSETS ---------------- */
  const fetchAssets = async () => {
    try {
      const res = await axios.get(`${API}/asset`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAssets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  /* ---------------- SAVE ASSET ---------------- */
  const handleSave = async () => {
    await axios.post(
      `${API}/asset`,
      {
        ...form,
        accessories: form.accessories.split(",").map((a) => a.trim()),
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setOpen(false);
    fetchAssets();
  };

  /* ---------------- UPDATE ASSET ---------------- */
  const handleUpdate = async () => {
    if (!editAsset) return;

    await axios.patch(
      `${API}/asset/${editAsset._id}`,
      {
        ...form,
        accessories: form.accessories.split(",").map((a) => a.trim()),
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setEditAsset(null);
    setOpen(false);
    fetchAssets();
  };

  /* ---------------- DELETE ASSET ---------------- */
  const handleDelete = async () => {
    if (!deleteAsset) return;

    await axios.delete(`${API}/asset/${deleteAsset._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    setDeleteAsset(null);
    fetchAssets();
  };

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      const matchesSearch =
        !q ||
        a.assetType?.toLowerCase().includes(q) ||
        a.serialNumber?.toLowerCase().includes(q) ||
        a.accessories?.join(", ").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [assets, search, statusFilter]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);

  const kpis = useMemo(() => {
    const total = assets.length;
    const available = assets.filter((a) => a.status === "AVAILABLE").length;
    const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
    const now = Date.now();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;
    const warrantyExpiringSoon = assets.filter((a) => {
      if (!a.warrantyExpiry) return false;
      const t = new Date(a.warrantyExpiry).getTime();
      return t >= now && t <= in30Days;
    }).length;
    return { total, available, assigned, warrantyExpiringSoon };
  }, [assets]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Asset Inventory
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Asset Management <span className="mx-1">›</span> Asset Inventory
          </p>
        </div>

        <button
          onClick={() => {
            setViewAsset(null);
            setEditAsset(null);
            setForm({
              assetType: "Laptop",
              serialNumber: "",
              warrantyExpiry: "",
              accessories: "",
              status: "AVAILABLE",
            });
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Assets" value={kpis.total} icon={Boxes} tone="primary" sublabel="All IT assets" />
        <StatCard
          label="Available"
          value={kpis.available}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.available / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Assigned" value={kpis.assigned} icon={Laptop} tone="warning" sublabel="Currently in use" />
        <StatCard
          label="Warranty Expiring Soon"
          value={kpis.warrantyExpiringSoon}
          icon={AlertTriangle}
          tone="critical"
          sublabel="Within next 30 days"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset type, serial number or accessories..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]",
                statusFilter !== "All" && "border-[var(--primary)] text-[var(--primary)]"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{statusFilter !== "All" ? `: ${statusFilter === "AVAILABLE" ? "Available" : "Assigned"}` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("AVAILABLE")}>Available</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("ASSIGNED")}>Assigned</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredAssets.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Boxes className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No assets match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Warranty Expiry</th>
                  <th className="px-4 py-3">Accessories</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedAssets.map((asset, i) => (
                  <tr key={asset._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{asset.assetType}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {asset.serialNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(asset.warrantyExpiry).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{asset.accessories.join(", ")}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          asset.status === "AVAILABLE"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            asset.status === "AVAILABLE" ? "bg-[var(--status-good)]" : "bg-[var(--status-warning)]"
                          )}
                        />
                        {asset.status}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View"
                          onClick={() => {
                            setViewAsset(asset);
                            setEditAsset(null);
                            setOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => {
                            setEditAsset(asset);
                            setViewAsset(null);
                            setForm({
                              assetType: asset.assetType,
                              serialNumber: asset.serialNumber,
                              warrantyExpiry: asset.warrantyExpiry.split("T")[0],
                              accessories: asset.accessories.join(", "),
                              status: asset.status,
                            });
                            setOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => setDeleteAsset(asset)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filteredAssets.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="assets"
            />
          </div>
        </div>
      )}

      {/* ADD / VIEW / EDIT MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
          <div className="card-premium relative w-full max-w-lg p-6 shadow-premium-sm">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              {viewAsset ? "View Asset" : editAsset ? "Edit Asset" : "Add Asset"}
            </h2>

            {/* FORM */}
            <div className="grid grid-cols-1 gap-4">
              {/* SERIAL NUMBER */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Serial Number</label>
                <input
                  disabled={!!viewAsset}
                  value={viewAsset?.serialNumber || form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                />
              </div>

              {/* WARRANTY EXPIRY */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Warranty Expiry</label>
                <input
                  type="date"
                  disabled={!!viewAsset}
                  value={viewAsset ? viewAsset.warrantyExpiry.split("T")[0] : form.warrantyExpiry}
                  onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                />
              </div>

              {/* ACCESSORIES */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Accessories</label>
                <input
                  disabled={!!viewAsset}
                  value={viewAsset ? viewAsset.accessories.join(", ") : form.accessories}
                  onChange={(e) => setForm({ ...form, accessories: e.target.value })}
                  placeholder="Mouse, Charger, Bag"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                />
              </div>

              {/* STATUS */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Asset Status</label>
                <select
                  disabled={!!viewAsset}
                  value={viewAsset?.status || form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            {!viewAsset && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                >
                  Cancel
                </button>

                <button
                  onClick={editAsset ? handleUpdate : handleSave}
                  className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
                >
                  {editAsset ? "Update Asset" : "Save Asset"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
          <div className="card-premium w-full max-w-sm p-6 shadow-premium-sm">
            <h3 className="text-lg font-semibold mb-2 text-[var(--status-critical)]">Delete Asset</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete this asset? This action is permanent.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteAsset(null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-[var(--status-critical)] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
