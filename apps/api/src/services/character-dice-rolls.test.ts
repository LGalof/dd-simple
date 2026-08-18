import assert from "node:assert/strict";
import test from "node:test";
import { createDiceRollForCharacterForUser } from "./character.service.js";
import { prisma } from "../lib/prisma.js";

const prismaStubs: Array<() => void> = [];

function stubPrismaMethod<T extends object>(
  target: T,
  methodName: keyof T,
  implementation: unknown,
) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(target, methodName);

  Object.defineProperty(target, methodName, {
    configurable: true,
    value: implementation,
    writable: true,
  });
  prismaStubs.push(() => {
    if (originalDescriptor) {
      Object.defineProperty(target, methodName, originalDescriptor);
    } else {
      delete target[methodName];
    }
  });
}

function restorePrismaStubs() {
  while (prismaStubs.length > 0) {
    prismaStubs.pop()?.();
  }
}

const diceRollInput = {
  formula: "1d20 + 5",
  modifier: 5,
  reason: "Attack",
  rollMode: "normal",
  rollType: "attack",
  rollValues: [{ sides: 20, value: 13 }],
  targetIndex: null,
  targetType: null,
  total: 18,
  visibility: "public",
};

test.afterEach(() => {
  restorePrismaStubs();
});

test("ordinary character dice rolls persist with null roomId", async () => {
  let createdData: unknown;

  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.diceRoll, "create", async (args: { data: unknown }) => {
    createdData = args.data;
    return { id: "roll-1" };
  });

  const result = await createDiceRollForCharacterForUser("user-1", "character-1", diceRollInput);

  assert.equal(result.status, "ok");
  assert.deepEqual(createdData, {
    characterId: "character-1",
    formula: "1d20 + 5",
    modifier: 5,
    reason: "Attack",
    roomId: null,
    rolledByUserId: "user-1",
    rollMode: "normal",
    rollType: "attack",
    rollValues: [{ sides: 20, value: 13 }],
    targetIndex: null,
    targetType: null,
    total: 18,
    visibility: "public",
  });
});

test("room-aware character dice rolls persist the verified room id", async () => {
  let roomLookupCode: string | undefined;
  let createdData: { roomId?: string | null } | undefined;

  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async (args: { where: { code: string } }) => {
    roomLookupCode = args.where.code;
    return { id: "room-1", players: [{ id: "player-1" }] };
  });
  stubPrismaMethod(prisma.diceRoll, "create", async (args: { data: { roomId?: string | null } }) => {
    createdData = args.data;
    return { id: "roll-1" };
  });

  const result = await createDiceRollForCharacterForUser(
    "user-1",
    "character-1",
    { ...diceRollInput, roomCode: "ABC123" },
  );

  assert.equal(result.status, "ok");
  assert.equal(roomLookupCode, "ABC123");
  assert.equal(createdData?.roomId, "room-1");
});

test("character dice rolls cannot be associated with unrelated rooms", async () => {
  let createCalled = false;

  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async () => ({ id: "room-1", players: [] }));
  stubPrismaMethod(prisma.diceRoll, "create", async () => {
    createCalled = true;
    return { id: "roll-1" };
  });

  const result = await createDiceRollForCharacterForUser(
    "user-1",
    "character-1",
    { ...diceRollInput, roomCode: "ABC123" },
  );

  assert.deepEqual(result, { status: "forbidden" });
  assert.equal(createCalled, false);
});

test("character dice rolls reject nonexistent room context", async () => {
  let createCalled = false;

  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async () => null);
  stubPrismaMethod(prisma.diceRoll, "create", async () => {
    createCalled = true;
    return { id: "roll-1" };
  });

  const result = await createDiceRollForCharacterForUser(
    "user-1",
    "character-1",
    { ...diceRollInput, roomCode: "ABC123" },
  );

  assert.deepEqual(result, { status: "room_not_found" });
  assert.equal(createCalled, false);
});
