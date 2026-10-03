const BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || process.env.EXPRESS_API_URL || "";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
}

// keeps the status code and the server's `details` (e.g. conflicting slots)
export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const fetchData = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { method = "GET", body, headers } = options;

  // Sanitize trailing/leading slashes to prevent url doubling
  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = BASE_URL ? `${BASE_URL}${formattedEndpoint}` : formattedEndpoint;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let message =
      response.status === 404 ? `Endpoint not found: ${method} ${endpoint}` : "Request failed";
    let details: Record<string, unknown> | undefined;

    try {
      const errorData = JSON.parse(text);
      message = errorData.message || `Error ${response.status}: ${response.statusText}`;
      details = errorData.details;
    } catch {
      if (text) message = text;
    }

    throw new ApiError(message, response.status, details);
  }

  // 204 (and any other empty-bodied success) has nothing to parse —
  // response.json() throws on an empty body instead of returning it.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};
