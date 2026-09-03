import type { Role } from "../role";

export interface AuthSession {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
}
