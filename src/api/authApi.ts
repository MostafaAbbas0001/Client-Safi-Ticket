import { apiRequest } from "./http";

export interface LoginResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

export function loginUser(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function forgotPassword(email: string): Promise<string> {
  return apiRequest<string>("/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(data: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<string> {
  return apiRequest<string>("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
