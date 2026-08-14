import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./api";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("sends authenticated get requests", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ value: 42 }));

    await expect(api.get("/sample", { token: "abc" })).resolves.toEqual({
      value: 42,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/sample", {
      headers: {
        Authorization: "Bearer abc",
      },
    });
  });

  it("serializes post, patch, and put request bodies", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ created: true }))
      .mockResolvedValueOnce(jsonResponse({ patched: true }))
      .mockResolvedValueOnce(jsonResponse({ saved: true }));

    await api.post("/items", { name: "Lantern" }, { keepalive: true });
    await api.patch("/items/1", { name: "Torch" }, { token: "token" });
    await api.put("/items/1", { quantity: 2 }, { token: "token" });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://127.0.0.1:4000/items",
      {
        body: JSON.stringify({ name: "Lantern" }),
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        method: "POST",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://127.0.0.1:4000/items/1",
      {
        body: JSON.stringify({ name: "Torch" }),
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        keepalive: undefined,
        method: "PATCH",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://127.0.0.1:4000/items/1",
      {
        body: JSON.stringify({ quantity: 2 }),
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        method: "PUT",
      },
    );
  });

  it("returns undefined for successful empty deletes", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(api.delete("/items/1")).resolves.toBeUndefined();
  });

  it("parses json delete responses when present", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ deleted: true }));

    await expect(api.delete("/items/1", { token: "token" })).resolves.toEqual({
      deleted: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:4000/items/1", {
      headers: {
        Authorization: "Bearer token",
      },
      method: "DELETE",
    });
  });

  it("uses server error messages when requests fail", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "No passage" }, { status: 403 }),
    );

    await expect(api.get("/locked")).rejects.toThrow("No passage");
  });

  it("falls back to status messages for non-json failures", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));

    await expect(api.post("/items", {})).rejects.toThrow(
      "Request failed with status 500",
    );
  });

  it("explains unreachable API servers", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(api.get("/health")).rejects.toThrow(
      "API server is unreachable at http://127.0.0.1:4000",
    );
  });
});
