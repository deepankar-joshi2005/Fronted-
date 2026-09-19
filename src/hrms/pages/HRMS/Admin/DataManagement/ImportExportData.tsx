
import { useState, useEffect } from "react";
import axios from "axios";
import { Download, Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

export default function ImportExportData() {
    const [modules, setModules] = useState<string[]>([
        "Companies", "Branches", "Departments", "Designations", "Roles", "Employees", "Attendance", "Leaves", "Payroll", "Payslips"
    ]);
    const [selectedModule, setSelectedModule] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [downloadingSample, setDownloadingSample] = useState(false);
    const { } = useAuth();



    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            // Use the new endpoint
            const res = await axios.get(`${API_BASE}/data-management/modules`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Ensure Companies and Branches are always present, merging with backend response
            const backendModules = Array.isArray(res.data) ? res.data : [];
            const defaultModules = ["Companies", "Branches", "Departments", "Designations", "Roles", "Employees", "Attendance", "Leaves", "Payroll", "Payslips"];
            const mergedModules = Array.from(new Set([...defaultModules, ...backendModules]));

            setModules(mergedModules);
        } catch (error) {
            console.error("❌ [ImportExportData] Failed to fetch modules:", error);
            toast.error("Failed to load available modules. Using default list.");
            // Fallback to default list on error
            const defaults = ["Companies", "Branches", "Departments", "Designations", "Roles", "Employees", "Attendance", "Leaves", "Payroll", "Payslips"];
            setModules(defaults);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!selectedModule) {
            toast.error("Please select a module first.");
            return;
        }

        try {
            setExporting(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/data-management/export`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { moduleName: selectedModule },
                responseType: 'blob', // Important for file download
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedModule}_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success(`${selectedModule} data exported successfully!`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export data.");
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedModule) {
            toast.error("Please select a module first.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('moduleName', selectedModule);

        try {
            setImporting(true);
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_BASE}/data-management/import`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
            });

            const { count, errors, message } = res.data;

            if (count > 0 && (!errors || errors.length === 0)) {
                toast.success(`Successfully imported ${count} records!`);
            } else if (count > 0 && errors.length > 0) {
                toast.warning(`Imported ${count} records with some errors.`);
                if (errors && errors.length > 0) {
                    errors.slice(0, 3).forEach((err: string) => toast.error(err));
                }
            } else {
                toast.error(message || "No records imported.");
                if (errors && errors.length > 0) {
                    errors.slice(0, 5).forEach((err: string) => toast.error(err));
                }
            }

            // Reset file input
            event.target.value = '';
        } catch (error: any) {
            console.error("Import failed:", error);
            const errorMsg = error.response?.data?.message || "Failed to import data. Please check the file format.";
            toast.error(errorMsg);
        } finally {
            setImporting(false);
        }
    };

    const downloadSample = async () => {
        if (!selectedModule) {
            toast.error("Please select a module first.");
            return;
        }

        try {
            setDownloadingSample(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/data-management/sample-download`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { moduleName: selectedModule },
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedModule}_sample.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Sample file downloaded successfully.");

        } catch (error) {
            console.error("Sample download failed:", error);
            toast.error("Failed to download sample file.");
        } finally {
            setDownloadingSample(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">Data Management</h1>
                <p className="text-sm text-[var(--muted-foreground)]">Import and Export system data for backup or migration.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Export Section */}
                <Card className="border-[var(--border)] bg-[var(--card)] shadow-premium-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[var(--status-warning)]">
                            <Download className="h-5 w-5" />
                            Export Data
                        </CardTitle>
                        <CardDescription>
                            Download full system data for specific modules in CSV format.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Select Module</label>
                            <Select onValueChange={setSelectedModule} value={selectedModule}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a module..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {modules.length === 0 && loading ? (
                                        <div className="p-2 flex justify-center text-sm text-[var(--muted-foreground)]">Loading modules...</div>
                                    ) : (
                                        modules.map((mod) => (
                                            <SelectItem key={mod} value={mod}>
                                                {mod}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={handleExport}
                            className="w-full bg-[var(--status-warning)] hover:opacity-90 text-white"
                            disabled={!selectedModule || exporting}
                        >
                            {exporting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                "Export Data"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card className="border-[var(--border)] bg-[var(--card)] shadow-premium-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[var(--primary)]">
                            <Upload className="h-5 w-5" />
                            Import Data
                        </CardTitle>
                        <CardDescription>
                            Upload CSV files to bulk insert or update system records.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg border flex gap-3 text-sm bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] border-[color-mix(in_oklab,var(--primary)_25%,transparent)] text-[var(--primary)]">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p>Make sure to download the sample file first to ensure your CSV has the correct headers.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={downloadSample}
                                disabled={!selectedModule || downloadingSample}
                                className="w-full"
                            >
                                {downloadingSample ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Sample File
                                    </>
                                )}
                            </Button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleImport}
                                    disabled={!selectedModule || importing}
                                />
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    disabled={!selectedModule || importing}
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        "Upload CSV"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
