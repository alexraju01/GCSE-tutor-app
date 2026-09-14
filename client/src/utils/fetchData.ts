const BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || process.env.EXPRESS_API_URL || "";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface FetchOptions {
	method?: HttpMethod;
	body?: unknown;
	headers?: HeadersInit;
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

	if (response.status === 404) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || `Endpoint not found: ${method} ${endpoint}`);
	}

	if (!response.ok) {
		let errorMessage = "Request failed";

		try {
			const errorData = await response.json();
			errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
		} catch {
			const text = await response.text();
			errorMessage = text || response.statusText;
		}

		throw new Error(errorMessage);
	}

	return response.json() as Promise<T>;
};
