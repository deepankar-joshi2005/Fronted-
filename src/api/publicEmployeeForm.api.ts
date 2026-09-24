import axios from "axios";

// Deliberately separate from axiosClient.js — a public visitor here is never
// a logged-in user, so this must never pick up an Authorization header or
// trigger the authenticated refresh-token interceptor. The scoped form token
// issued by identifyEmployee is sent as a custom header instead.
const API_URL = import.meta.env.VITE_API_URL || "/api";
const publicClient = axios.create({ baseURL: `${API_URL}/v1/public/business-clients` });

export const getPublicBusinessClient = (token) => publicClient.get(`/${token}`);

export const identifyEmployee = (token, employeeCode) =>
  publicClient.post(`/${token}/identify`, { employeeCode });

export const submitEmployeeForm = (token, formToken, payload) =>
  publicClient.post(`/${token}/employees`, payload, {
    headers: { "X-Employee-Form-Token": formToken },
  });
