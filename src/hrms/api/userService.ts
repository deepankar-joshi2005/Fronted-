import axiosInstance from "./axiosInstance";

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Reset a user's password
 * Permissions:
 * - SuperAdmin: can reset anyone's password
 * - LeadMentor: can reset anyone except SuperAdmin
 * - SchoolAdmin: can reset anyone except SuperAdmin and LeadMentor
 * - Mentor (SchoolMentor): can reset students' passwords only
 * - Students: can only reset their own password
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await axiosInstance.post("/users/reset-password", data);
  return response.data;
};

