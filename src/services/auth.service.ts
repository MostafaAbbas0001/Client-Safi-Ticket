import { apiClient } from "./api-client";
import type { Role } from "@/models/ticket";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
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
  exp?: number;
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
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) throw new Error("Invalid authentication token.");

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return JSON.parse(atob(paddedBase64)) as JwtPayload;
}

function getTokenExpirationTime(token: string) {
  try {
    const decodedToken = decodeJwtPayload(token);
    return typeof decodedToken.exp === "number" ? decodedToken.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const authService = {
  async login(request: LoginRequest) {
    const response = await apiClient.post<TokenResponse>("/api/auth/login", request);
    const decodedToken = decodeJwtPayload(response.token);
    const expirationTime = getTokenExpirationTime(response.token);

    if (expirationTime !== null && expirationTime <= Date.now()) {
      throw new Error("Authentication token has expired.");
    }

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
      role: role?.trim().toLowerCase() === "admin" ? "admin" : "officer",
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  forgotPassword(email: string) {
    return apiClient.post<string>("/api/auth/forgot-password", { email });
  },

  resetPassword(email: string, token: string, newPassword: string) {
    return apiClient.post<string>("/api/auth/reset-password", { email, token, newPassword });
  },

  getSession() {
    const storedSession = localStorage.getItem(AUTH_SESSION_KEY);
    if (!storedSession) return null;

    try {
      const session = JSON.parse(storedSession) as AuthSession;
      const expirationTime = getTokenExpirationTime(session.token);

      if (!session.token || (expirationTime !== null && expirationTime <= Date.now())) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      this.logout();
      return null;
    }
  },

  getSessionExpirationTime(session: AuthSession) {
    return getTokenExpirationTime(session.token);
  },

  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },
};
