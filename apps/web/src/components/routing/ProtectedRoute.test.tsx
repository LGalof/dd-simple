import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../../features/auth/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("react-router-dom", () => ({
  Navigate: ({ replace, state, to }: { replace?: boolean; state?: unknown; to: string }) => (
    <div
      data-replace={String(Boolean(replace))}
      data-state={JSON.stringify(state)}
      data-testid="navigate"
      data-to={to}
    />
  ),
  useLocation: () => ({ pathname: "/rooms", search: "?tab=mine" }),
}));

vi.mock("../../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderProtected(children: ReactNode = <div>Private</div>) {
  render(<ProtectedRoute>{children}</ProtectedRoute>);
}

describe("ProtectedRoute", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a loading shell while auth state is pending", () => {
    mockedUseAuth.mockReturnValue({
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      user: null,
    });

    renderProtected();

    expect(screen.getByText("Loading account...")).toBeTruthy();
  });

  it("redirects anonymous users with the current return location", () => {
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      user: null,
    });

    renderProtected();

    expect(screen.getByTestId("navigate").getAttribute("data-to")).toBe("/login");
    expect(screen.getByTestId("navigate").getAttribute("data-replace")).toBe("true");
    expect(screen.getByTestId("navigate").getAttribute("data-state")).toContain(
      "/rooms?tab=mine",
    );
  });

  it("renders children for authenticated users", () => {
    mockedUseAuth.mockReturnValue({
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: "token",
      user: { displayName: "Hero", email: "hero@example.com", id: "u1" },
    });

    renderProtected();

    expect(screen.getByText("Private")).toBeTruthy();
  });
});
