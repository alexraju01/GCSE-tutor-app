const BASE_URL = process.env.EXPRESS_API_URL;

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
}

export const fetchData = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { method = "GET", body, headers } = options;

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  console.log("response====:", response);
  if (response.status === 404) {
    const errorData = await response.json().catch(() => ({}));
    // Throwing a custom error will trigger the nearest error.tsx
    throw new Error(errorData.message || "Not Found");
  }
  if (!response.ok) {
    let errorMessage = "Request failed";

    try {
      // Try to parse the server's custom error structure
      const errorData = (await response.json()) as APIResponse<T>;
      errorMessage =
        errorData.message || `Error ${response.status}: ${response.statusText}`;
    } catch {
      // Fallback if the response isn't JSON (e.g., a timeout or raw text error)
      const text = await response.text();
      errorMessage = text || response.statusText;
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
};
