const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function parseErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Fall back to a status-based message when the server does not return JSON.
  }

  return `Request failed with status ${response.status}`;
}

async function get<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function post<TResponse, TBody>(path: string, body: TBody) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as TResponse;
}

async function patch<TResponse, TBody>(path: string, body: TBody) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as TResponse;
}

async function deleteRequest(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

const api = {
  delete: deleteRequest,
  get,
  patch,
  post,
};

export { API_BASE_URL, api };
