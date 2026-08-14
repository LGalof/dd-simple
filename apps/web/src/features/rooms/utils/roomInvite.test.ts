import { afterEach, describe, expect, it, vi } from "vitest";
import { buildRoomInviteUrl, copyRoomInviteUrl } from "./roomInvite";

describe("buildRoomInviteUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the current deployment origin and normalizes the room code", () => {
    expect(buildRoomInviteUrl(" ab12cd ", "https://dd-simple.example")).toBe(
      "https://dd-simple.example/rooms/join?roomCode=AB12CD",
    );
  });

  it("copies the generated invite URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });

    await expect(copyRoomInviteUrl("xy999z")).resolves.toContain(
      "/rooms/join?roomCode=XY999Z",
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("/rooms/join?roomCode=XY999Z"),
    );
  });
});
