import { apiClient } from "./api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: "admin" | "officer";
}

interface TokenResponse {
  token: string;
}

const AUTH_SESSION_KEY = "safi.auth.session";

interface JwtPayload {
  [claim: string]: unknown;
  nameid?: string;
  unique_name?: string;
  email?: string;
  role?: string;
}

const claimTypes = {
  nameIdentifier: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
};

function getClaim(payload: JwtPayload, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function normalizeRole(role?: string): AuthSession["role"] {
  return role?.trim().toLowerCase() === "admin" ? "admin" : "officer";
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return atob(paddedBase64);
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Invalid authentication token.");
  }

  return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
}

export const authService = {
  async login(request: LoginRequest) {
    const response = await apiClient.post<TokenResponse>("/api/auth/login", request);
    const decodedToken = decodeJwtPayload(response.token);
    const userId = getClaim(decodedToken, "nameid", claimTypes.nameIdentifier);
    const name = getClaim(decodedToken, "unique_name", claimTypes.name);
    const email = getClaim(decodedToken, "email", claimTypes.email);
    const role = getClaim(decodedToken, "role", claimTypes.role);

    if (!userId || !name || !email) {
      throw new Error("Authentication token is missing required user claims.");
    }

    const session: AuthSession = {
      token: response.token,
      userId: Number(userId),
      name,
      email,
      role: normalizeRole(role),
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

    return session;
  },

  forgotPassword(email: string) {
    return apiClient.post<string>("/api/auth/forgot-password", { email });
  },

  resetPassword(email: string, token: string, newPassword: string) {
    return apiClient.post<string>("/api/auth/reset-password", {
      email,
      token,
      newPassword,
    });
  },

  getSession() {
    const storedSession = localStorage.getItem(AUTH_SESSION_KEY);

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession) as AuthSession;
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  },

  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },
};
