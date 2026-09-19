import axiosInstance from "./axiosInstance";

export interface CRMNotification {
	_id: string;
	message: string;
	leadId?: {
		_id: string;
		leadNo: string;
		schoolName: string;
	} | null;
	leadNo: string;
	changes?: Record<string, unknown>;
	type?: string;
	metadata?: Record<string, unknown>;
	createdBy?: {
		_id: string;
		name: string;
		email: string;
	} | null;
	createdByName: string;
	createdByRole: string;
	readBy?: string[];
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CRMNotificationListResponse {
	success: boolean;
	data: CRMNotification[];
	total: number;
	page: number;
	pages: number;
}

export const crmNotificationService = {
	list: async (params: any = {}): Promise<CRMNotificationListResponse> => {
		const res = await axiosInstance.get("/crm-notifications", { params });
		return res.data;
	},
	getUnreadCount: async (): Promise<{ success: boolean; count: number }> => {
		const res = await axiosInstance.get("/crm-notifications/unread-count");
		return res.data;
	},
	markAsRead: async (id: string): Promise<{ success: boolean; message: string }> => {
		const res = await axiosInstance.post(`/crm-notifications/${id}/read`);
		return res.data;
	},
	markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
		const res = await axiosInstance.post("/crm-notifications/mark-all-read");
		return res.data;
	},
};

