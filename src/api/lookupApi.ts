import { apiRequest } from "./http";

export interface LookupItem {
  id: number;
  name: string;
}

export interface UserLookupItem {
  id: number;
  name: string;
  email?: string;
}

function normalizeLookupItem(item: any): LookupItem {
  return {
    id: item.id ?? item.Id,
    name: item.name ?? item.Name ?? item.type ?? item.Type ?? "",
  };
}

function normalizeUserLookupItem(item: any): UserLookupItem {
  return {
    id: item.id ?? item.Id,
    name: item.name ?? item.Name ?? "",
    email: item.email ?? item.Email,
  };
}

export function getStatuses(): Promise<LookupItem[]> {
  return apiRequest<any[]>("/Status").then((items) => items.map(normalizeLookupItem));
}

export function getPriorities(): Promise<LookupItem[]> {
  return apiRequest<any[]>("/Priority").then((items) => items.map(normalizeLookupItem));
}

export function getUsers(): Promise<UserLookupItem[]> {
  return apiRequest<any[]>("/User").then((items) => items.map(normalizeUserLookupItem));
}

export function getRoles(): Promise<LookupItem[]> {
  return apiRequest<any[]>("/Role").then((items) => items.map(normalizeLookupItem));
}
