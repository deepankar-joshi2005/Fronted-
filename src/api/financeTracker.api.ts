import axiosClient from "./axiosClient.js";

const base = "/finance-tracker/profiles";

export const listFinanceProfiles = () => axiosClient.get(base);
export const getFinanceProfile = (id: string, params?: { annualRate?: number; tenureMonths?: number }) =>
  axiosClient.get(`${base}/${id}`, { params });
export const createFinanceProfile = (payload: any) => axiosClient.post(base, payload);
export const updateFinanceProfile = (id: string, payload: any) => axiosClient.put(`${base}/${id}`, payload);
export const deleteFinanceProfile = (id: string) => axiosClient.delete(`${base}/${id}`);
export const computeFinanceProjection = (id: string, payload: { monthlyContribution: number; annualReturnPercent: number }) =>
  axiosClient.post(`${base}/${id}/projection`, payload);
