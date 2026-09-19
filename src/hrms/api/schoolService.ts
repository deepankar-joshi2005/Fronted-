import axiosInstance from "./axiosInstance";


export interface GradeWithSections {
  grade: number;
  sections: string[];
}

export interface AvailableGrade {
  grade: number;
  sections: string[];
}

export interface ServiceDetails {
  serviceType?: string;
  mentors: ("School Mentor" | "ThinkPro Mentor")[];
  subjects: string[];
  grades: GradeWithSections[];
}

export interface School {
  _id: string;
  name: string;
  address: string;
  boards: ("CBSE" | "ICSE" | "State Board" | "IGCSE" | "IB" | "Other")[];
  image?: string;
  logo?: string;
  affiliatedTo?: string;
  state: string;
  city: string;
  district: string;
  pinCode: string;
  schoolEmail: string;
  schoolWebsite?: string;
  principalName: string;
  principalContact: string;
  principalEmail: string;
  stemCoordinatorName?: string;
  stemCoordinatorContact?: string;
  stemCoordinatorEmail?: string;
  branchName?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  serviceDetails?: ServiceDetails;
  students_strength: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolHead {
  name: string;
  designation: string;
  email: string;
  phoneNumber: string;
  profilePic?: string | File;
}

export interface CreateSchoolData {
  name: string;
  address: string;
  boards: ("CBSE" | "ICSE" | "State Board" | "IGCSE" | "IB" | "Other")[];
  image?: File;
  logo?: File;
  affiliatedTo?: string;
  state: string;
  city: string;
  stateId?: string;
  districtId?: string;
  district: string;
  pinCode: string;
  schoolEmail: string;
  schoolWebsite?: string;
  principalName: string;
  principalContact: string;
  principalEmail: string;
  stemCoordinatorName?: string;
  stemCoordinatorContact?: string;
  stemCoordinatorEmail?: string;
  branchName?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  serviceDetails?: ServiceDetails;
  students_strength: number;
}

export interface UpdateSchoolData extends Partial<CreateSchoolData> {}

// School API functions
export const schoolService = {
  // Get all schools
  getAll: async (filters?: { 
    state?: string; 
    city?: string; 
    statusFilter?: string;
    name?: string;
    board?: string;
    strength?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: School[]; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'all') params.append('state', filters.state);
    if (filters?.city && filters.city !== 'all') params.append('city', filters.city);
    if (filters?.statusFilter) {
      if (filters.statusFilter === 'all') {
        params.append('includeInactive', 'true');
      } else if (filters.statusFilter === 'inactive') {
        params.append('includeInactive', 'true');
        params.append('inactiveOnly', 'true');
      }
      // For 'active', we don't add any parameters (default behavior)
    }
    if (filters?.name && filters.name !== '') params.append('name', filters.name);
    if (filters?.board && filters.board !== '') params.append('affiliatedTo', filters.board);
    if (filters?.strength && filters.strength !== 'all') params.append('strength', filters.strength);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const response = await axiosInstance.get(`/schools?${params.toString()}`);
    return response.data;
  },

  // Get all schools (alias for getAll)
  getAllSchools: async (): Promise<School[]> => {
    const response = await schoolService.getAll();
    return response.data;
  },

  // Get school by ID
  getById: async (id: string): Promise<{ success: boolean; data: School }> => {
    const response = await axiosInstance.get(`/schools/${id}`);
    return response.data;
  },

  // Create new school
  create: async (data: CreateSchoolData): Promise<{ success: boolean; data: School; message: string }> => {
    const formData = new FormData();
    
    // Add all fields to FormData
    formData.append('name', data.name);
    formData.append('address', data.address);
    formData.append('boards', JSON.stringify(data.boards));
    formData.append('state', data.state);
    formData.append('city', data.city);
    formData.append('district', data.district);
    formData.append('pinCode', data.pinCode);
    formData.append('schoolEmail', data.schoolEmail);
    formData.append('principalName', data.principalName);
    formData.append('principalContact', data.principalContact);
    formData.append('principalEmail', data.principalEmail);
    formData.append('students_strength', data.students_strength.toString());
    
    if (data.image) formData.append('image', data.image);
    if (data.logo) formData.append('logo', data.logo);
    if (data.affiliatedTo) formData.append('affiliatedTo', data.affiliatedTo);
    if (data.schoolWebsite) formData.append('schoolWebsite', data.schoolWebsite);
    if (data.stemCoordinatorName) formData.append('stemCoordinatorName', data.stemCoordinatorName);
    if (data.stemCoordinatorContact) formData.append('stemCoordinatorContact', data.stemCoordinatorContact);
    if (data.stemCoordinatorEmail) formData.append('stemCoordinatorEmail', data.stemCoordinatorEmail);
    if (data.branchName) formData.append('branchName', data.branchName);
    if (data.projectStartDate) formData.append('projectStartDate', data.projectStartDate);
    if (data.projectEndDate) formData.append('projectEndDate', data.projectEndDate);
    if (data.serviceDetails) formData.append('serviceDetails', JSON.stringify(data.serviceDetails));

    const response = await axiosInstance.post("/schools", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update school
  update: async (id: string, data: UpdateSchoolData): Promise<{ success: boolean; data: School; message: string }> => {
    const formData = new FormData();
    
    // Add all fields to FormData
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.address !== undefined) formData.append('address', data.address);
    if (data.boards !== undefined) formData.append('boards', JSON.stringify(data.boards));
    if (data.state !== undefined) formData.append('state', data.state);
    if (data.city !== undefined) formData.append('city', data.city);
    if (data.district !== undefined) formData.append('district', data.district);
    if (data.pinCode !== undefined) formData.append('pinCode', data.pinCode);
    if (data.schoolEmail !== undefined) formData.append('schoolEmail', data.schoolEmail);
    if (data.principalName !== undefined) formData.append('principalName', data.principalName);
    if (data.principalContact !== undefined) formData.append('principalContact', data.principalContact);
    if (data.principalEmail !== undefined) formData.append('principalEmail', data.principalEmail);
    if (data.students_strength !== undefined) formData.append('students_strength', data.students_strength.toString());
    if (data.image !== undefined) formData.append('image', data.image);
    if (data.logo !== undefined) formData.append('logo', data.logo);
    if (data.affiliatedTo !== undefined) formData.append('affiliatedTo', data.affiliatedTo);
    if (data.schoolWebsite !== undefined) formData.append('schoolWebsite', data.schoolWebsite);
    if (data.stemCoordinatorName !== undefined) formData.append('stemCoordinatorName', data.stemCoordinatorName);
    if (data.stemCoordinatorContact !== undefined) formData.append('stemCoordinatorContact', data.stemCoordinatorContact);
    if (data.stemCoordinatorEmail !== undefined) formData.append('stemCoordinatorEmail', data.stemCoordinatorEmail);
    if (data.branchName !== undefined) formData.append('branchName', data.branchName);
    if (data.projectStartDate !== undefined) formData.append('projectStartDate', data.projectStartDate);
    if (data.projectEndDate !== undefined) formData.append('projectEndDate', data.projectEndDate);
    if (data.serviceDetails !== undefined) formData.append('serviceDetails', JSON.stringify(data.serviceDetails));

    const response = await axiosInstance.put(`/schools/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete school
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/schools/${id}`);
    return response.data;
  },

  // Toggle school activation status
  toggleStatus: async (id: string, isActive: boolean): Promise<{ success: boolean; data: School; message: string }> => {
    const response = await axiosInstance.patch(`/schools/${id}/toggle-status`, { isActive });
    return response.data;
  },

  // Get school service details for grade/section filtering
  getServiceDetails: async (id: string): Promise<{ success: boolean; data: { grades: AvailableGrade[]; hasServiceDetails: boolean } }> => {
    const response = await axiosInstance.get(`/schools/${id}/service-details`);
    return response.data;
  },

  // Get school count
  getCount: async (filters?: { includeInactive?: boolean; inactiveOnly?: boolean }): Promise<{ success: boolean; data: { total: number; active: number; inactive: number } }> => {
    const params = new URLSearchParams();
    if (filters?.includeInactive) params.append('includeInactive', 'true');
    if (filters?.inactiveOnly) params.append('inactiveOnly', 'true');
    const url = params.toString() ? `/schools/count?${params.toString()}` : '/schools/count';
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
