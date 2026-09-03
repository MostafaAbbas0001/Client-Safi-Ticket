export interface JwtPayload {
  [claim: string]: unknown;
  nameid?: string;
  unique_name?: string;
  email?: string;
  role?: string;
  exp?: number;
}
