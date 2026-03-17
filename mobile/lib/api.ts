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
  const url = buildUrl(path);
  console.log('[API] Request:', { method, url, body: !!body });
  const response = await fetch(url, {
    method,
    headers: buildHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  console.log('[API] Response status:', response.status);

  let payload: ApiResponse<T> | null = null;
  try {
    const text = await response.text();
    console.log('[API] Response body:', text.substring(0, 500));
    payload = JSON.parse(text) as ApiResponse<T>;
  } catch (error) {
    console.log('[API] JSON parse error:', error);
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
