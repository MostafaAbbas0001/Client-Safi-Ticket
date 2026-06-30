import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loginUser } from "@/api/authApi";

export type Role = "admin" | "officer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ticketing.auth.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<User>;
      if (typeof saved.id === "number" && saved.token) {
        setUser(saved as User);
        localStorage.setItem("token", saved.token);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("token");
      }
    } catch {}
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginUser(email.trim(), password);
    const role = response.role.toLowerCase() === "admin" ? "admin" : "officer";
    const signedInUser: User = {
      id: response.userId,
      name: response.name,
      email: response.email,
      role,
      token: response.token,
    };

    setUser(signedInUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signedInUser));
    localStorage.setItem("token", response.token);

    return signedInUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
