const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:4000";

type RequestOptions = {
  token?: string | null;
};

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { error?: string };

    return body.error ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function authHeaders(token?: string | null): Record<string, string> {
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function get<T>(path: string, options: RequestOptions = {}) {
  const response = await fetchApi(path, {
    headers: authHeaders(options.token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

async function post<T>(path: string, body: unknown, options: RequestOptions = {}) {
  const response = await fetchApi(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options.token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

async function patch<T>(path: string, body: unknown, options: RequestOptions = {}) {
  const response = await fetchApi(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options.token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

async function put<T>(path: string, body: unknown, options: RequestOptions = {}) {
  const response = await fetchApi(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options.token),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

async function deleteRequest<T = void>(path: string, options: RequestOptions = {}) {
  const response = await fetchApi(path, {
    method: "DELETE",
    headers: authHeaders(options.token),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function fetchApi(path: string, init: RequestInit) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error(
      `API server is unreachable at ${API_BASE_URL}. In a VS Code terminal, run .\\.tools\\node22\\npm.cmd run dev and keep it open.`,
    );
  }
}

const api = {
  delete: deleteRequest,
  get,
  patch,
  post,
  put,
};

export { API_BASE_URL, api };
