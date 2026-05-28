export type ApiListResponse<T> = {
  items: T[];
};

export type ApiItemResponse<T> = {
  item: T;
};

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5002/api"
).replace(/\/$/, "");

const buildUrl = (path: string) => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

const readErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { message?: string };
    if (data?.message) return data.message;
  } catch {
    // Ignore JSON parse errors and fall back to status text.
  }

  return `${response.status} ${response.statusText}`.trim();
};

export const apiGet = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
};

export const apiPostJson = async <T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
};

export const apiPostForm = async <T>(path: string, body: FormData): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
};
