import assert from "node:assert/strict";
import test from "node:test";
import { ensureHostedRoomLimit, RoomLimitError } from "./room.service.js";

test("allows a user to create up to three rooms", () => {
  assert.doesNotThrow(() => ensureHostedRoomLimit(0));
  assert.doesNotThrow(() => ensureHostedRoomLimit(2));
});

test("rejects creation after the third hosted room", () => {
  assert.throws(() => ensureHostedRoomLimit(3), RoomLimitError);
});
