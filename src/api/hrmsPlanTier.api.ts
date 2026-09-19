import axiosClient from "./axiosClient.js";

export const listHrmsPlanTiers = () => axiosClient.get("/hrms-plan-tiers");
export const updateHrmsPlanTier = (id, payload) => axiosClient.put(`/hrms-plan-tiers/${id}`, payload);
