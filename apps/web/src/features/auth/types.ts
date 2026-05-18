type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type { AuthResponse, AuthUser };
