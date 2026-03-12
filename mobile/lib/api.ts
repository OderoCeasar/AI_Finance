type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type ApiResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  message?: string;
  errors?: unknown;
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path;
  }
  const normalizedPath = path.replace(/^\//, '');
  return `${API_BASE_URL}/${normalizedPath}`;
};

const buildHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> => {
  const { method = 'GET', body, token } = options;
  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    payload = null;
  }

  if (response.ok && payload?.success) {
    return {
      ok: true,
      status: response.status,
      data: payload.data,
      message: payload.message,
    };
  }

  return {
    ok: false,
    status: response.status,
    message: payload?.message ?? 'Request failed.',
    errors: payload?.data ?? payload,
  };
};

export const apiRequest = request;

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body, token }),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) => request<T>(path, { method: 'DELETE', token }),
};
