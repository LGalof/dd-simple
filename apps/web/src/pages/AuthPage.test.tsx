import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { AuthPage } from "./AuthPage";

vi.mock("react-router-dom", () => ({
  Navigate: ({ replace, to }: { replace?: boolean; to: string }) => (
    <div data-replace={String(Boolean(replace))} data-testid="navigate" data-to={to} />
  ),
  useLocation: () => ({
    state: { returnTo: "/characters" },
  }),
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/auth/components/AuthForm", () => ({
  AuthForm: ({ mode, returnTo }: { mode: string; returnTo?: string }) => (
    <div data-testid="auth-form">
      {mode}:{returnTo}
    </div>
  ),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("AuthPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows loading state while auth is being restored", () => {
    mockedUseAuth.mockReturnValue({
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      user: null,
    });

    render(<AuthPage mode="login" />);

    expect(screen.getByText("Nalaganje racuna...")).toBeTruthy();
  });

  it("redirects authenticated users back to their target", () => {
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: "token",
      user: { displayName: "Hero", email: "hero@example.com", id: "u1" },
    });

    render(<AuthPage mode="login" />);

    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe(
      "/characters",
    );
    expect(screen.getByTestId("navigate").getAttribute("data-replace")).toBe(
      "true",
    );
  });

  it("renders the matching auth form for anonymous users", () => {
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      user: null,
    });

    render(<AuthPage mode="register" />);

    expect(screen.getByTestId("auth-form").textContent).toBe(
      "register:/characters",
    );
  });
});
