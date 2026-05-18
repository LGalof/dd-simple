import { api } from "../../../lib/api";
import type { AuthResponse, AuthUser } from "../types";

type AuthCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = AuthCredentials & {
  displayName?: string;
};

async function login(credentials: AuthCredentials) {
  return api.post<AuthResponse>("/auth/login", credentials);
}

async function register(credentials: RegisterCredentials) {
  return api.post<AuthResponse>("/auth/register", credentials);
}

async function fetchCurrentUser(token: string) {
  return api.get<{ user: AuthUser }>("/auth/me", {
    token,
  });
}

export { fetchCurrentUser, login, register };
