import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../lib/api";
import { fetchCurrentUser, login, register } from "./authApi";

vi.mock("../../../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("authApi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("posts login credentials", async () => {
    mockedApi.post.mockResolvedValueOnce({ token: "token" });

    await expect(
      login({ email: "hero@example.com", password: "secret" }),
    ).resolves.toEqual({ token: "token" });

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "hero@example.com",
      password: "secret",
    });
  });

  it("posts register credentials", async () => {
    mockedApi.post.mockResolvedValueOnce({ token: "token" });

    await register({
      displayName: "Hero",
      email: "hero@example.com",
      password: "secret",
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/register", {
      displayName: "Hero",
      email: "hero@example.com",
      password: "secret",
    });
  });

  it("fetches the current user with a bearer token", async () => {
    mockedApi.get.mockResolvedValueOnce({ user: { id: "u1" } });

    await fetchCurrentUser("token");

    expect(mockedApi.get).toHaveBeenCalledWith("/auth/me", {
      token: "token",
    });
  });
});
