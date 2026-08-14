import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../../../lib/api";
import {
  createRoom,
  deleteRoom,
  getCreatedRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  normalizeRoomCodeInput,
} from "./roomsApi";

vi.mock("../../../lib/api", () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe("normalizeRoomCodeInput", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uppercases direct room codes", () => {
    expect(normalizeRoomCodeInput("cum9y2")).toBe("CUM9Y2");
  });

  it("extracts room codes from surrounding text", () => {
    expect(normalizeRoomCodeInput("Room CUM9Y2")).toBe("CUM9Y2");
  });

  it("prefers explicit room links over other six-letter URL fragments", () => {
    expect(normalizeRoomCodeInput("https://example.com/dd-simple/room/CUM9Y2")).toBe("CUM9Y2");
    expect(normalizeRoomCodeInput("http://localhost:5173/rooms/join?roomCode=CUM9Y2")).toBe("CUM9Y2");
  });

  it("creates rooms for the selected character", async () => {
    mockedApi.post.mockResolvedValueOnce({ room: { code: "ABC123" } });

    await createRoom("character-1", "token");

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/rooms",
      { characterId: "character-1" },
      { token: "token" },
    );
  });

  it("joins and fetches normalized room codes", async () => {
    mockedApi.post.mockResolvedValueOnce({ room: { code: "ABC123" } });
    mockedApi.get.mockResolvedValueOnce({ room: { code: "ABC123" } });

    await joinRoom("https://example.test/room/abc123", "character-1", "token");
    await getRoom("abc123", "token");

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/rooms/ABC123/join",
      { characterId: "character-1" },
      { token: "token" },
    );
    expect(mockedApi.get).toHaveBeenCalledWith("/rooms/ABC123", {
      token: "token",
    });
  });

  it("lists, deletes, and leaves rooms", async () => {
    mockedApi.get.mockResolvedValueOnce({ rooms: [] });
    mockedApi.delete.mockResolvedValue(undefined);

    await getCreatedRooms("token");
    await deleteRoom("room ABC123", "token");
    await leaveRoom("https://example.test/room/def456", "token");

    expect(mockedApi.get).toHaveBeenCalledWith("/rooms", { token: "token" });
    expect(mockedApi.delete).toHaveBeenNthCalledWith(1, "/rooms/ABC123", {
      token: "token",
    });
    expect(mockedApi.delete).toHaveBeenNthCalledWith(2, "/rooms/DEF456/leave", {
      token: "token",
    });
  });
});
