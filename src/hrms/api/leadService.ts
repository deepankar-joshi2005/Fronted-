import axiosInstance from "./axiosInstance";

export interface Lead {
	_id: string;
	leadNo: string;
	schoolName: string;
	postalAddress?: string;
	city?: string;
	state?: string;
	district?: string;
	pinCode?: string;
	boardAffiliated?: string;
	principalName?: string;
	principalContact?: string;
	principalEmail?: string;
	schoolEmail?: string;
	schoolWebsite?: string;
	keyPersonName?: string;
	keyPersonContact?: string;
	keyPersonEmail?: string;
	roboticsAtlPresent?: "Yes" | "No";
	noOfStudents?: number | null;
	avgFeesPerYear?: number | null;
	qualified?: "Yes" | "No";
	salesExecutive?: string | { _id: string; name: string; email: string; user?: { _id: string } } | null;
	salesManager?: string | { _id: string; name: string; email: string; user?: { _id: string } } | null;
	leadSource?: "Internal" | "Channel Partner";
	leadRemarks?: string;
	phase?: string;
	programType?: "Pilot" | "Full";
	qualityOfLead?: "Cold" | "Warm" | "Hot";
	deliveryModel?: "TPA Managed" | "School Managed" | "Hybrid";
	salesStartDate?: string | null;
	salesClosedDate?: string | null;
	salesCycle?: "2025-2026" | "2026-2027";
	teamRemarks?: string;
	actionNeeded?: string;
	actionOn?: string | { _id: string; name: string; email: string; user?: { _id: string }; type?: "manager" | "executive" } | null;
	actionOnModel?: "SalesManager" | "SalesExecutive" | null;
	actionDueDate?: string | null;
	annualContractValue?: number | null;
	createdBy: string | { _id: string; name?: string; email?: string };
	isActive?: boolean;
	createdAt: string;
	updatedAt?: string;
}

export interface LeadListResponse {
	success: boolean;
	data: Lead[];
	total: number;
	page: number;
	pages: number;
}

export interface CreateLeadPayload extends Partial<Lead> {
	schoolName: string;
}

export interface LeadPhaseSummaryItem {
  order: number;
  phase: string;
  count: number;
}

export const leadService = {
	list: async (params: any = {}): Promise<LeadListResponse> => {
		const res = await axiosInstance.get("/leads", { params });
		return res.data;
	},
		getPhaseSummary: async (params: any = {}): Promise<{ success: boolean; data: LeadPhaseSummaryItem[] }> => {
			const res = await axiosInstance.get("/leads/summary", { params });
		return res.data;
	},
	getById: async (id: string): Promise<{ success: boolean; data: Lead }> => {
		const res = await axiosInstance.get(`/leads/${id}`);
		return res.data;
	},
	create: async (payload: CreateLeadPayload): Promise<{ success: boolean; data: Lead; message: string }> => {
		const res = await axiosInstance.post("/leads", payload);
		return res.data;
	},
	update: async (id: string, payload: Partial<Lead>): Promise<{ success: boolean; data: Lead; message: string }> => {
		const res = await axiosInstance.put(`/leads/${id}`,(payload as any));
		return res.data;
	},
	activate: async (id: string): Promise<{ success: boolean; message: string }> => {
		const res = await axiosInstance.patch(`/leads/${id}/activate`);
		return res.data;
	},
	remove: async (id: string): Promise<{ success: boolean; message: string }> => {
		const res = await axiosInstance.delete(`/leads/${id}`);
		return res.data;
	},
	exportToExcel: async (params: any = {}): Promise<Blob> => {
		const res = await axiosInstance.get("/leads/export", {
			params,
			responseType: "blob",
		});
		return res.data;
	},
};


