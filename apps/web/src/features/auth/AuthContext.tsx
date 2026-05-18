import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "./api/authApi";
import type { AuthUser } from "./types";

const AUTH_TOKEN_STORAGE_KEY = "dd-simple.authToken";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = LoginData & {
  displayName?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const storeAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const currentToken = token;

    async function loadCurrentUser() {
      try {
        const response = await fetchCurrentUser(currentToken);

        if (isMounted) {
          setUser(response.user);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const login = useCallback(
    async (data: LoginData) => {
      const response = await loginRequest(data);
      storeAuth(response.token, response.user);
    },
    [storeAuth],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await registerRequest(data);
      storeAuth(response.token, response.user);
    },
    [storeAuth],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [loading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}

export { AuthProvider, useAuth };
