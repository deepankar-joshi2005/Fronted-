import axiosClient from "./axiosClient.js";

const base = "/finance-tracker/profiles";

export const listFinanceProfiles = (params?: { page?: number; limit?: number; search?: string }) => axiosClient.get(base, { params });
export const getFinanceProfile = (id: string, params?: { annualRate?: number; tenureMonths?: number }) =>
  axiosClient.get(`${base}/${id}`, { params });
export const createFinanceProfile = (payload: any) => axiosClient.post(base, payload);
export const updateFinanceProfile = (id: string, payload: any) => axiosClient.put(`${base}/${id}`, payload);
export const deleteFinanceProfile = (id: string) => axiosClient.delete(`${base}/${id}`);
export const computeFinanceProjection = (id: string, payload: { monthlyContribution: number; annualReturnPercent: number }) =>
  axiosClient.post(`${base}/${id}/projection`, payload);
// "Send Report" — emails the report PDF and/or sends it on WhatsApp to the client.
export const shareFinanceReport = (
  id: string,
  payload: { channels: ("email" | "whatsapp")[]; pdfBase64?: string; fileName?: string; annualRate?: number; tenureMonths?: number }
) => axiosClient.post(`${base}/${id}/share`, payload);
