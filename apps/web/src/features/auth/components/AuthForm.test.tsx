import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../AuthContext";
import { AuthForm } from "./AuthForm";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    state,
    to,
  }: {
    children: React.ReactNode;
    state?: unknown;
    to: string;
  }) => (
    <a data-state={JSON.stringify(state ?? null)} href={to}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock("../AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe("AuthForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("submits login credentials and returns to the requested route", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      login,
      loading: false,
      logout: vi.fn(),
      register: vi.fn(),
      token: null,
      user: null,
    });

    render(<AuthForm mode="login" returnTo="/characters" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "hero@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: "hero@example.com",
        password: "password",
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith("/characters", { replace: true });
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe(
      "/register",
    );
  });

  it("submits register credentials and displays auth errors", async () => {
    const register = vi.fn().mockRejectedValueOnce(new Error("Email already exists"));
    mockedUseAuth.mockReturnValue({
      login: vi.fn(),
      loading: false,
      logout: vi.fn(),
      register,
      token: null,
      user: null,
    });

    render(<AuthForm mode="register" />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Aria" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "aria@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        displayName: "Aria",
        email: "aria@example.com",
        password: "password",
      }),
    );
    expect(await screen.findByText("Email already exists")).toBeTruthy();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
