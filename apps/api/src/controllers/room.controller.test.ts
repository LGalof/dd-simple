import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  createRoomController,
  deleteRoomController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
  listRoomsForUserController,
} from "./room.controller.js";

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

function createResponse() {
  const response = {
    body: undefined as unknown,
    sent: false,
    statusCode: 200,
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send() {
      this.sent = true;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };

  return response as Response & typeof response;
}

const authedRequest = {
  user: { displayName: "Hero", email: "hero@example.com", id: "u1" },
} as unknown as Request;
const createdAt = new Date("2026-01-01T10:00:00.000Z");
const updatedAt = new Date("2026-01-01T10:05:00.000Z");

function character(overrides = {}) {
  return {
    armorClass: 15,
    currentHp: 12,
    id: "char-1",
    maxHp: 18,
    name: "Mira",
    speed: 30,
    abilityScores: [{ abilityIndex: "dex", score: 16 }],
    ...overrides,
  };
}

function roomRecord(overrides = {}) {
  return {
    boardState: { tokens: [] },
    code: "ABC123",
    createdAt,
    creatorCharacterId: "char-1",
    creatorUserId: "u1",
    id: "room-1",
    players: [
      {
        characterId: "char-1",
        characterName: "Mira",
        joinedAt: createdAt,
        userId: "u1",
      },
    ],
    updatedAt,
    ...overrides,
  };
}

test.afterEach(() => {
  restorePrismaStubs();
});

test("room controllers validate required params and body values", async () => {
  const createResponseObject = createResponse();
  await createRoomController({ ...authedRequest, body: { characterId: "" } } as unknown as Request, createResponseObject);
  assert.equal(createResponseObject.statusCode, 400);

  const deleteResponse = createResponse();
  await deleteRoomController({ ...authedRequest, params: {} } as unknown as Request, deleteResponse);
  assert.equal(deleteResponse.statusCode, 400);

  const joinRoomCodeResponse = createResponse();
  await joinRoomController(
    { ...authedRequest, body: { characterId: "char-1" }, params: {} } as unknown as Request,
    joinRoomCodeResponse,
  );
  assert.equal(joinRoomCodeResponse.statusCode, 400);

  const joinCharacterResponse = createResponse();
  await joinRoomController(
    { ...authedRequest, body: { characterId: "" }, params: { roomCode: "ABC123" } } as unknown as Request,
    joinCharacterResponse,
  );
  assert.equal(joinCharacterResponse.statusCode, 400);

  const getResponse = createResponse();
  await getRoomController({ params: {} } as unknown as Request, getResponse);
  assert.equal(getResponse.statusCode, 400);
});

test("getRoomController returns 404 and serialized room payloads", async () => {
  stubPrismaMethod(prisma.room, "findUnique", async () => null);

  const notFoundResponse = createResponse();
  await getRoomController(
    { params: { roomCode: "ABC123" } } as unknown as Request,
    notFoundResponse,
  );
  assert.equal(notFoundResponse.statusCode, 404);

  restorePrismaStubs();
  const createdAt = new Date("2026-01-01T10:00:00.000Z");
  const updatedAt = new Date("2026-01-01T10:05:00.000Z");
  stubPrismaMethod(prisma.room, "findUnique", async () => ({
    boardState: { tokens: [] },
    code: "ABC123",
    createdAt,
    creatorCharacterId: "char-1",
    creatorUserId: "u1",
    players: [
      {
        characterId: "char-1",
        characterName: "Mira",
        joinedAt: createdAt,
        userId: "u1",
      },
    ],
    updatedAt,
  }));

  const successResponse = createResponse();
  await getRoomController(
    { params: { roomCode: "abc123" } } as unknown as Request,
    successResponse,
  );

  assert.equal(successResponse.statusCode, 200);
  assert.deepEqual(successResponse.body, {
    room: {
      boardState: { tokens: [] },
      code: "ABC123",
      createdAt: createdAt.getTime(),
      creatorCharacterId: "char-1",
      creatorUserId: "u1",
      players: [
        {
          characterId: "char-1",
          characterName: "Mira",
          joinedAt: createdAt.getTime(),
          userId: "u1",
        },
      ],
      updatedAt: updatedAt.getTime(),
    },
  });
});

test("createRoomController creates rooms and handles missing characters", async () => {
  stubPrismaMethod(prisma.character, "findFirst", async () => null);

  const missingCharacterResponse = createResponse();
  await createRoomController(
    { ...authedRequest, body: { characterId: "missing" } } as unknown as Request,
    missingCharacterResponse,
  );
  assert.equal(missingCharacterResponse.statusCode, 404);

  restorePrismaStubs();
  stubPrismaMethod(prisma.character, "findFirst", async () => character());
  stubPrismaMethod(prisma.characterSpellcastingState, "findUnique", async () => null);
  stubPrismaMethod(prisma.characterResourceState, "findUnique", async () => null);
  stubPrismaMethod(prisma, "$transaction", async (callback: (tx: unknown) => unknown) =>
    callback({
      $executeRaw: async () => undefined,
      room: {
        count: async () => 0,
        create: async () => roomRecord(),
        findUnique: async () => null,
      },
    }),
  );

  const successResponse = createResponse();
  await createRoomController(
    { ...authedRequest, body: { characterId: "char-1" } } as unknown as Request,
    successResponse,
  );

  assert.equal(successResponse.statusCode, 201);
  assert.deepEqual((successResponse.body as { room: { code: string; players: unknown[] } }).room.players, [
    {
      characterId: "char-1",
      characterName: "Mira",
      joinedAt: createdAt.getTime(),
      userId: "u1",
    },
  ]);
});

test("joinRoomController joins rooms and reports service failures", async () => {
  stubPrismaMethod(prisma.room, "findUnique", async () => roomRecord());
  stubPrismaMethod(prisma.character, "findFirst", async () => character({ id: "char-2", name: "Torin" }));
  stubPrismaMethod(prisma.characterSpellcastingState, "findUnique", async () => null);
  stubPrismaMethod(prisma.characterResourceState, "findUnique", async () => null);
  stubPrismaMethod(prisma, "$transaction", async (callback: (tx: unknown) => unknown) =>
    callback({
      $executeRaw: async () => undefined,
      room: {
        findUnique: async ({ where }: { where: { id?: string } }) =>
          where.id
            ? roomRecord({
                players: [
                  ...roomRecord().players,
                  {
                    characterId: "char-2",
                    characterName: "Torin",
                    joinedAt: updatedAt,
                    userId: "u2",
                  },
                ],
              })
            : roomRecord(),
        update: async () => roomRecord(),
      },
      roomPlayer: {
        count: async () => 0,
        create: async () => undefined,
      },
    }),
  );

  const successResponse = createResponse();
  await joinRoomController(
    {
      ...authedRequest,
      body: { characterId: "char-2" },
      params: { roomCode: "abc123" },
      user: { displayName: "Player", email: "player@example.com", id: "u2" },
    } as unknown as Request,
    successResponse,
  );

  assert.equal(successResponse.statusCode, 200);
  assert.equal((successResponse.body as { room: { players: unknown[] } }).room.players.length, 2);

  restorePrismaStubs();
  stubPrismaMethod(prisma.room, "findUnique", async () => null);
  const notFoundResponse = createResponse();
  await joinRoomController(
    { ...authedRequest, body: { characterId: "char-1" }, params: { roomCode: "missing" } } as unknown as Request,
    notFoundResponse,
  );
  assert.equal(notFoundResponse.statusCode, 404);
});

test("room list, delete, and leave controllers serialize status responses", async () => {
  stubPrismaMethod(prisma.room, "findMany", async () => [
    {
      ...roomRecord(),
      _count: { players: 1 },
      creator: { displayName: "Hero", email: "hero@example.com" },
      creatorCharacter: { name: "Mira" },
    },
  ]);

  const listResponse = createResponse();
  await listRoomsForUserController(authedRequest, listResponse);
  assert.equal((listResponse.body as { rooms: Array<{ code: string }> }).rooms[0]?.code, "ABC123");

  restorePrismaStubs();
  stubPrismaMethod(prisma.room, "deleteMany", async () => ({ count: 1 }));
  const deleteResponse = createResponse();
  await deleteRoomController(
    { ...authedRequest, params: { roomCode: "ABC123" } } as unknown as Request,
    deleteResponse,
  );
  assert.equal(deleteResponse.statusCode, 204);
  assert.equal(deleteResponse.sent, true);

  restorePrismaStubs();
  stubPrismaMethod(prisma, "$transaction", async () => ({ status: "creator" }));
  const leaveCreatorResponse = createResponse();
  await leaveRoomController(
    { ...authedRequest, params: { roomCode: "ABC123" } } as unknown as Request,
    leaveCreatorResponse,
  );
  assert.equal(leaveCreatorResponse.statusCode, 400);

  restorePrismaStubs();
  stubPrismaMethod(prisma, "$transaction", async () => ({ roomCode: "ABC123", status: "left" }));
  const leaveResponse = createResponse();
  await leaveRoomController(
    { ...authedRequest, params: { roomCode: "ABC123" } } as unknown as Request,
    leaveResponse,
  );
  assert.equal(leaveResponse.statusCode, 204);
});
