type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Record<string, QueryValue>;
}

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error("Missing required environment variable: VITE_API_BASE_URL");
}

const apiBaseUrl = configuredApiBaseUrl.replace(/\/$/, "");
const authSessionKey = "safi.auth.session";

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${apiBaseUrl}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, query, ...requestOptions } = options;
  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  const authToken = getAuthToken();

  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    body: hasJsonBody ? JSON.stringify(body) : body,
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  const payload = await readResponse(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function getAuthToken() {
  const storedSession = localStorage.getItem(authSessionKey);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as { token?: unknown };
    return typeof session.token === "string" && session.token.trim() ? session.token : null;
  } catch {
    localStorage.removeItem(authSessionKey);
    return null;
  }
}

export function getApiUrl(path: string, query?: Record<string, QueryValue>) {
  return buildUrl(path, query);
}

export function getAuthorizationHeaders() {
  const authToken = getAuthToken();

  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
