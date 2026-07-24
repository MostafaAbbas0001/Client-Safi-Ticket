type QueryPrimitive = string | number | boolean | null | undefined;
type QueryValue = QueryPrimitive | QueryPrimitive[];

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
export const authSessionExpiredEvent = "safi.auth.expired";

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${apiBaseUrl}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];

    values.forEach((item) => {
      if (item !== null && item !== undefined && item !== "") {
        url.searchParams.append(key, String(item));
      }
    });
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
    if (response.status === 401) {
      expireAuthSession();
    }

    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return atob(paddedBase64);
}

function getTokenExpirationTime(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: unknown };

    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const expirationTime = getTokenExpirationTime(token);

  return expirationTime !== null && expirationTime <= Date.now();
}

function expireAuthSession() {
  localStorage.removeItem(authSessionKey);
  window.dispatchEvent(new Event(authSessionExpiredEvent));
}

function getAuthToken() {
  const storedSession = localStorage.getItem(authSessionKey);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as { token?: unknown };
    const token = typeof session.token === "string" ? session.token.trim() : "";

    if (!token) {
      return null;
    }

    if (isTokenExpired(token)) {
      expireAuthSession();
      return null;
    }

    return token;
  } catch {
    expireAuthSession();
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
