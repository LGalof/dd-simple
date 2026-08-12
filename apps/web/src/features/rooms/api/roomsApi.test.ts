import { describe, expect, it } from "vitest";

import { normalizeRoomCodeInput } from "./roomsApi";

describe("normalizeRoomCodeInput", () => {
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
});
