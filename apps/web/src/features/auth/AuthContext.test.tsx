import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "./api/authApi";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("./api/authApi", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockedLoginRequest = vi.mocked(loginRequest);
const mockedRegisterRequest = vi.mocked(registerRequest);

function AuthConsumer() {
  const auth = useAuth();

  return (
    <div>
      <p>loading:{String(auth.loading)}</p>
      <p>token:{auth.token ?? "none"}</p>
      <p>user:{auth.user?.email ?? "none"}</p>
      <button
        type="button"
        onClick={() => void auth.login({ email: "login@example.com", password: "password" })}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() =>
          void auth.register({
            displayName: "Hero",
            email: "register@example.com",
            password: "password",
          })
        }
      >
        Register
      </button>
      <button type="button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

function renderProvider() {
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("restores a saved token and logs out when the session is invalid", async () => {
    window.localStorage.setItem("dd-simple.authToken", "saved-token");
    mockedFetchCurrentUser.mockRejectedValueOnce(new Error("expired"));

    renderProvider();

    expect(screen.getByText("loading:true")).toBeTruthy();
    await screen.findByText("loading:false");
    expect(screen.getByText("token:none")).toBeTruthy();
    expect(window.localStorage.getItem("dd-simple.authToken")).toBeNull();
  });

  it("stores auth data from login and register responses and supports logout", async () => {
    mockedFetchCurrentUser.mockResolvedValue({
      user: { displayName: "Current", email: "current@example.com", id: "u-current" },
    });
    mockedLoginRequest.mockResolvedValueOnce({
      token: "login-token",
      user: { displayName: "Login", email: "login@example.com", id: "u1" },
    });
    mockedRegisterRequest.mockResolvedValueOnce({
      token: "register-token",
      user: { displayName: "Register", email: "register@example.com", id: "u2" },
    });

    renderProvider();

    await screen.findByText("loading:false");

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText("token:login-token");
    expect(screen.getByText("user:current@example.com")).toBeTruthy();
    expect(window.localStorage.getItem("dd-simple.authToken")).toBe("login-token");

    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    await screen.findByText("token:register-token");
    expect(screen.getByText("user:current@example.com")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(screen.getByText("token:none")).toBeTruthy();
    expect(screen.getByText("user:none")).toBeTruthy();
  });

  it("throws when useAuth is rendered outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<AuthConsumer />)).toThrow("useAuth must be used inside AuthProvider");

    consoleError.mockRestore();
  });
});
