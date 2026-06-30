import { apiRequest } from "./http";

export interface CreateUserInput {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleId: number;
}

export async function createUser(data: CreateUserInput): Promise<void> {
  await apiRequest<string>("/User", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
