import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureHostedRoomLimit,
  ensureJoinedRoomLimit,
  JoinedRoomLimitError,
  RoomLimitError,
} from "./room.service.js";

test("allows a user to create up to three rooms", () => {
  assert.doesNotThrow(() => ensureHostedRoomLimit(0));
  assert.doesNotThrow(() => ensureHostedRoomLimit(2));
});

test("rejects creation after the third hosted room", () => {
  assert.throws(() => ensureHostedRoomLimit(3), RoomLimitError);
});

test("allows a user to join up to six rooms", () => {
  assert.doesNotThrow(() => ensureJoinedRoomLimit(0));
  assert.doesNotThrow(() => ensureJoinedRoomLimit(5));
});

test("rejects joining a seventh room", () => {
  assert.throws(() => ensureJoinedRoomLimit(6), JoinedRoomLimitError);
});
