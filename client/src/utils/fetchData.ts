const BASE_URL = process.env.EXPRESS_API_URL;

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export const fetchData = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { method = "GET", body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Content-Type", "application/json");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
};
