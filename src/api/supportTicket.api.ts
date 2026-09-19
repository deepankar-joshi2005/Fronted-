import axiosClient from "./axiosClient.js";

export const listTickets = (params) => axiosClient.get("/support-tickets", { params });
export const getTicket = (id) => axiosClient.get(`/support-tickets/${id}`);
export const createTicket = (payload) => axiosClient.post("/support-tickets", payload);
export const replyToTicket = (id, payload) => axiosClient.post(`/support-tickets/${id}/reply`, payload);
export const updateTicketStatus = (id, payload) => axiosClient.put(`/support-tickets/${id}/status`, payload);
