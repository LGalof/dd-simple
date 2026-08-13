import { describe, expect, it } from "vitest";
import { buildRoomInviteUrl } from "./roomInvite";

describe("buildRoomInviteUrl", () => {
  it("uses the current deployment origin and normalizes the room code", () => {
    expect(buildRoomInviteUrl(" ab12cd ", "https://dd-simple.example")).toBe(
      "https://dd-simple.example/rooms/join?roomCode=AB12CD",
    );
  });
});
