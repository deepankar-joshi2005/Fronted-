import axiosClient from "./axiosClient.js";

const base = (businessClientId: string) => `/business-clients/mine/${businessClientId}/payroll`;

export const getPayrollSettings = (businessClientId: string) => axiosClient.get(`${base(businessClientId)}/settings`);
export const updatePayrollSettings = (businessClientId: string, payload: any) =>
  axiosClient.put(`${base(businessClientId)}/settings`, payload);

// blob, not a plain href — axiosClient carries the in-memory bearer token that a
// bare <a href> navigation wouldn't have access to.
export const downloadPayrollTemplate = (businessClientId: string) =>
  axiosClient.get(`${base(businessClientId)}/template`, { responseType: "blob" });

// ── Salary Structure (per month) ────────────────────────────────────────────

export const getStructureForMonth = (businessClientId: string, month: string) =>
  axiosClient.get(`${base(businessClientId)}/structure/${month}`);

export const updateComponentPercentages = (businessClientId: string, payload: { percentages: Record<string, number>; month?: string }) =>
  axiosClient.put(`${base(businessClientId)}/structure/settings`, payload);

export const previewStructureUpload = (businessClientId: string, month: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosClient.post(`${base(businessClientId)}/structure/${month}/upload/preview`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const confirmStructureUpload = (businessClientId: string, month: string, payload: any) =>
  axiosClient.post(`${base(businessClientId)}/structure/${month}/upload/confirm`, payload);

export const updateCostCenter = (businessClientId: string, month: string, costCenter: string) =>
  axiosClient.put(`${base(businessClientId)}/structure/${month}/cost-center`, { costCenter });

export const updateEmployeeStructure = (businessClientId: string, month: string, employeeId: string, payload: any) =>
  axiosClient.put(`${base(businessClientId)}/structure/${month}/employees/${employeeId}`, payload);

export const saveStructureForMonth = (businessClientId: string, month: string) =>
  axiosClient.post(`${base(businessClientId)}/structure/${month}/save`);

// ── Firm-wide payroll settings (Employee ID format + rolling default %) ────

export const getFirmPayrollSettings = () => axiosClient.get(`/business-clients/mine/payroll-firm-settings`);
export const updateFirmPayrollSettings = (payload: { employeeIdPrefix?: string; employeeIdPadding?: number }) =>
  axiosClient.put(`/business-clients/mine/payroll-firm-settings`, payload);

// ── Runs ─────────────────────────────────────────────────────────────────

export const generateClientPayroll = (businessClientId: string, month: string) =>
  axiosClient.post(`${base(businessClientId)}/${month}/generate`);
export const runClientPayroll = (businessClientId: string, month: string) =>
  axiosClient.post(`${base(businessClientId)}/${month}/run`);

export const listClientPayrollRuns = (businessClientId: string) => axiosClient.get(base(businessClientId));
export const getClientPayrollRunDetail = (businessClientId: string, month: string) =>
  axiosClient.get(`${base(businessClientId)}/${month}`);

export const exportClientPayrollRun = (businessClientId: string, month: string) =>
  axiosClient.get(`${base(businessClientId)}/${month}/export`, { responseType: "blob" });

export const downloadEmployeePayslip = (businessClientId: string, month: string, employeeId: string) =>
  axiosClient.get(`${base(businessClientId)}/${month}/entries/${employeeId}/payslip`, { responseType: "blob" });
