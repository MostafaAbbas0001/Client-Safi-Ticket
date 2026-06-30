export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5044/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  console.log("API request:", url);

  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    if (text) {
      let errorMessage: string | null = null;

      try {
        const parsedError = JSON.parse(text);
        if (typeof parsedError?.message === "string") {
          errorMessage = parsedError.message;
        }
      } catch {
        // Fall back to the raw response text below.
      }

      if (errorMessage) {
        throw new Error(errorMessage);
      }
    }

    throw new Error(
      text || `Request failed: ${response.status} ${response.statusText}`
    );
  }

  // Backend returned no body, common for DELETE/204.
  if (!text) {
    return undefined as T;
  }

  // Backend returned JSON.
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return JSON.parse(text) as T;
  }

  // Backend returned plain text like "Ticket created" or "Ticket deleted".
  return text as T;
}
