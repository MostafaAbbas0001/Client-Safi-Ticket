import type { AuthSession } from "../auth";

export interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}
