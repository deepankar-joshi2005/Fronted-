import axiosInstance from "./axiosInstance";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Request password reset email
 * @param email User's email address
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> => {
  const response = await axiosInstance.post("/auth/forgot-password", data);
  return response.data;
};

/**
 * Reset password using token from email
 * @param token Password reset token from email
 * @param newPassword New password to set
 */
export const resetPasswordWithToken = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response = await axiosInstance.post("/auth/reset-password", data);
  return response.data;
};

