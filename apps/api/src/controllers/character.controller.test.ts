import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  addCharacterCondition,
  createCharacter,
  createCharacterDiceRoll,
  deleteCharacter,
  getCharacterActions,
  getCharacterById,
  getCharacterDefenses,
  getCharacterDerivedState,
  getCharacterInventory,
  getCharacterInventoryState,
  getCharacters,
  isAbilityScoresBody,
  isBooleanRecord,
  isCharacterChoiceRequestBody,
  isCharacterDerivedPreviewRequestBody,
  isCharacterMutationRequestBody,
  isDiceRollValues,
  isFeatureChoiceSelectionRequestBody,
  isHitPointStateRequestBody,
  isJsonLikeValue,
  isNumericRecord,
  isResourceStateRequestBody,
  isSpellcastingStateRequestBody,
  isValidFeatureChoiceSelectionArray,
  normalizeBoundedOptionalString,
  normalizeCharacterPreviewOverrides,
  normalizeFeatureChoiceSelections,
  normalizeNumericRecord,
  normalizeOptionalString,
  normalizeResourceState,
  normalizeSpellcastingState,
  parseCharacterPreviewOverrides,
  parseDiceRollRequestBody,
  parseInventoryMutationBody,
  parseInventoryStateBody,
  parsePreviewFeatIndexes,
  previewCharacterDerivedState,
  removeCharacterCondition,
  updateCharacter,
  updateCharacterFullInventory,
  updateCharacterInventory,
  updateCharacterInventoryState,
} from "./character.controller.js";

const abilityScores = {
  cha: 10,
  con: 14,
  dex: 12,
  int: 8,
  str: 16,
  wis: 13,
};

const featureChoice = {
  choicePath: "feature.options[0]",
  selectedOptionType: "reference",
  selectedRawJson: { item: { index: "tough" } },
  sourceIndex: "ability-score-improvement",
  sourceType: "FEATURE",
};

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

function request(overrides: Partial<Request> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    user: { displayName: "Hero", email: "hero@example.com", id: "user-1" },
    ...overrides,
  } as unknown as Request;
}

function validDiceRollBody(overrides: Record<string, unknown> = {}) {
  return {
    formula: "1d20 + 5",
    modifier: 5,
    reason: "Attack",
    rollMode: "normal",
    rollType: "attack",
    rollValues: [{ sides: 20, value: 17 }],
    total: 22,
    visibility: "public",
    ...overrides,
  };
}

test.afterEach(() => {
  restorePrismaStubs();
});

test("character mutation validators accept complete payloads and reject malformed values", () => {
  const body = {
    abilityScores,
    alignment: "Neutral",
    backgroundIndex: "soldier",
    choices: [
      {
        choiceType: "class-skill-choice",
        selectedIndex: "skill-athletics",
        selectedType: "skill",
        sourceIndex: "fighter",
        sourceType: "class",
      },
      {
        choiceType: "species-language-choice",
        selectedIndex: "giant",
        selectedType: "language",
        sourceIndex: "human",
        sourceType: "species",
      },
      {
        choiceType: "species-heritage-choice",
        selectedIndex: "high-elf",
        selectedType: "subspecies",
        sourceIndex: "elf",
        sourceType: "species",
      },
      {
        choiceType: "background-ability-plan",
        selectedIndex: "increase-two-scores-2-1",
        selectedType: "ability-plan",
        sourceIndex: "soldier",
        sourceType: "background",
      },
      {
        choiceType: "background-ability-score-choice",
        selectedIndex: "str",
        selectedType: "ability-score",
        sourceIndex: "soldier:score-a",
        sourceType: "background",
      },
    ],
    classIndex: "fighter",
    currentHp: 12,
    featureChoices: [featureChoice],
    hitPointState: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [10, 6],
      tempHp: 0,
    },
    level: 2,
    name: "Kael",
    resourceState: {
      activeByResourceKey: { actionSurge: true },
      customMaxByResourceKey: { actionSurge: 1 },
      usageByResourceKey: { actionSurge: 0 },
    },
    skillIndexes: ["athletics"],
    speciesIndex: "human",
    spellcastingState: {
      learnedSpellIds: [" shield ", "shield", "fireball"],
      preparedSpellIds: ["shield"],
      slotUsageByLevel: { "1": 1 },
    },
  };

  assert.equal(isCharacterMutationRequestBody(body), true);
  assert.equal(isAbilityScoresBody(abilityScores), true);
  assert.equal(isAbilityScoresBody({ ...abilityScores, str: 21 }), false);
  assert.equal(isCharacterMutationRequestBody({ ...body, name: "" }), false);
  assert.equal(isCharacterMutationRequestBody({ ...body, featureChoices: [featureChoice, featureChoice] }), false);
  assert.equal(isHitPointStateRequestBody(body.hitPointState), true);
  assert.equal(isHitPointStateRequestBody({ ...body.hitPointState, tempHp: -1 }), false);
  assert.equal(isSpellcastingStateRequestBody(body.spellcastingState), true);
  assert.equal(isSpellcastingStateRequestBody({ slotUsageByLevel: { one: 1 } }), false);
  assert.equal(isResourceStateRequestBody(body.resourceState), true);
  assert.equal(isResourceStateRequestBody({ ...body.resourceState, usageByResourceKey: { rage: 1000 } }), false);
});

test("feature choice validators require unique logical selections and JSON-safe payloads", () => {
  assert.equal(isFeatureChoiceSelectionRequestBody(featureChoice), true);
  assert.equal(isFeatureChoiceSelectionRequestBody({ ...featureChoice, selectedRawJson: undefined }), false);
  assert.equal(isFeatureChoiceSelectionRequestBody({ ...featureChoice, level: 21 }), false);
  assert.equal(isValidFeatureChoiceSelectionArray([featureChoice]), true);
  assert.equal(isValidFeatureChoiceSelectionArray([featureChoice, { ...featureChoice, selectedRawJson: { other: true } }]), false);
  assert.equal(isJsonLikeValue({ a: [1, "two", true, null] }), true);
  assert.equal(isJsonLikeValue({ bad: Number.NaN }), false);

  assert.deepEqual(normalizeFeatureChoiceSelections([
    {
      ...featureChoice,
      choiceKey: " feat ",
      choiceLabel: "",
      selectedOptionIndex: " tough ",
      selectedOptionName: "",
    },
  ]), [
    {
      choiceKey: "feat",
      choiceLabel: null,
      choicePath: "feature.options[0]",
      classIndex: null,
      featureIndex: null,
      grantsRawJson: null,
      level: null,
      selectedOptionIndex: "tough",
      selectedOptionName: null,
      selectedOptionType: "reference",
      selectedOptionUrl: null,
      selectedRawJson: { item: { index: "tough" } },
      sourceIndex: "ability-score-improvement",
      sourceType: "FEATURE",
      subclassIndex: null,
    },
  ]);
});

test("dice roll parsing normalizes optional fields and rejects unsafe rolls", () => {
  assert.deepEqual(parseDiceRollRequestBody({
    formula: " 1d20 + 5 ",
    rollType: "attack",
    rollValues: [{ sides: 20, value: 17 }, { discarded: true, sides: 20, value: 2 }],
    total: 22,
  }), {
    formula: "1d20 + 5",
    modifier: 0,
    reason: null,
    roomCode: null,
    rollMode: "normal",
    rollType: "attack",
    rollValues: [{ sides: 20, value: 17 }, { discarded: true, sides: 20, value: 2 }],
    targetIndex: null,
    targetType: null,
    total: 22,
    visibility: "private",
  });
  assert.equal(parseDiceRollRequestBody({ formula: "", rollType: "attack", rollValues: [], total: 0 }), null);
  assert.equal(parseDiceRollRequestBody({ formula: "1d20", rollType: "bad", rollValues: [], total: 0 }), null);
  assert.equal(parseDiceRollRequestBody({ formula: "1d20", rollType: "attack", rollValues: [], roomCode: "bad", total: 0 }), null);
  assert.equal(parseDiceRollRequestBody({ formula: "1d20", rollType: "attack", rollValues: [], roomCode: 123, total: 0 }), null);
  assert.equal(isDiceRollValues([{ sides: 6, value: 6 }]), true);
  assert.equal(isDiceRollValues([{ sides: 6, value: 7 }]), false);
  assert.equal(normalizeBoundedOptionalString("  note  ", 10), "note");
  assert.equal(normalizeBoundedOptionalString("too long", 3), undefined);
});

test("preview override parsing handles query and body forms", () => {
  assert.deepEqual(parsePreviewFeatIndexes(["tough,lucky", "tough", " alert "]), ["tough", "lucky", "alert"]);
  assert.deepEqual(parseCharacterPreviewOverrides({
    backgroundIndex: " soldier ",
    classIndex: "fighter",
    featIndex: "tough,lucky",
    level: "5",
    speciesIndex: "human",
    subclassIndex: "",
    subspeciesIndex: "variant-human",
  }), {
    backgroundIndex: "soldier",
    classIndex: "fighter",
    featIndexes: ["tough", "lucky"],
    level: 5,
    speciesIndex: "human",
    subclassIndex: undefined,
    subspeciesIndex: "variant-human",
  });
  assert.equal(isCharacterDerivedPreviewRequestBody({
    abilityScores,
    featIndexes: ["tough"],
    featureChoices: [featureChoice],
    level: 10,
    resourceState: {
      activeByResourceKey: {},
      customMaxByResourceKey: {},
      usageByResourceKey: {},
    },
  }), true);
  assert.deepEqual(normalizeCharacterPreviewOverrides({
    backgroundIndex: " soldier ",
    classIndex: " fighter ",
    featIndexes: [" tough ", ""],
    level: 4,
    speciesIndex: " human ",
  }), {
    abilityScores: undefined,
    backgroundIndex: "soldier",
    classIndex: "fighter",
    featIndexes: ["tough"],
    featureChoices: undefined,
    level: 4,
    resourceState: undefined,
    speciesIndex: "human",
    subclassIndex: undefined,
    subspeciesIndex: undefined,
  });
});

test("inventory and record parsers normalize dashboard payloads", () => {
  assert.deepEqual(parseInventoryMutationBody({
    items: [
      {
        customName: undefined,
        equipmentIndex: " shield ",
        equipped: true,
        gridX: null,
        gridY: 2,
        notes: "Equipped",
        quantity: 1,
      },
    ],
  }), [
    {
      customName: null,
      equipmentIndex: "shield",
      equipped: true,
      gridX: null,
      gridY: 2,
      notes: "Equipped",
      quantity: 1,
    },
  ]);
  assert.equal(parseInventoryMutationBody({ items: [{ equipmentIndex: "", equipped: true, quantity: 1 }] }), null);
  assert.equal(parseInventoryMutationBody({ items: new Array(201).fill({ equipmentIndex: "x", equipped: false, quantity: 1 }) }), null);
  assert.equal(parseInventoryStateBody({ stateCode: " abc " }), "abc");
  assert.equal(parseInventoryStateBody({ stateCode: "" }), null);

  assert.equal(isBooleanRecord({ rage: false }), true);
  assert.equal(isBooleanRecord({ "": true }), false);
  assert.equal(isNumericRecord({ rage: 2 }), true);
  assert.equal(isNumericRecord({ rage: 2.5 }), false);
  assert.deepEqual(normalizeNumericRecord({ rage: 2.9, "": 4, bad: -1 }), { rage: 2 });
  assert.deepEqual(normalizeSpellcastingState({
    learnedSpellIds: [" shield ", "shield", ""],
    preparedSpellIds: [" shield "],
    slotUsageByLevel: { "1": 1.9, "2": -4 },
  }), {
    learnedSpellIds: ["shield"],
    preparedSpellIds: ["shield"],
    slotUsageByLevel: { "1": 1, "2": 0 },
  });
  assert.deepEqual(normalizeResourceState({
    activeByResourceKey: { rage: true, "": false },
    customMaxByResourceKey: { rage: 3 },
    usageByResourceKey: { rage: 1 },
  }), {
    activeByResourceKey: { rage: true },
    customMaxByResourceKey: { rage: 3 },
    usageByResourceKey: { rage: 1 },
  });
  assert.equal(normalizeOptionalString(" value "), "value");
  assert.equal(normalizeOptionalString(" "), null);
});

test("choice validators recognize the supported character choice variants", () => {
  assert.equal(isCharacterChoiceRequestBody({
    choiceType: "class-skill-choice",
    selectedIndex: "skill-stealth",
    selectedType: "skill",
    sourceIndex: "rogue",
    sourceType: "class",
  }), true);
  assert.equal(isCharacterChoiceRequestBody({
    choiceType: "class-skill-choice",
    selectedIndex: "stealth",
    selectedType: "skill",
    sourceIndex: "rogue",
    sourceType: "class",
  }), false);
  assert.equal(isCharacterChoiceRequestBody({
    choiceType: "background-ability-score-choice",
    selectedIndex: "dex",
    selectedType: "ability-score",
    sourceIndex: "criminal:score-a",
    sourceType: "background",
  }), true);
});

test("character controllers reject invalid ids and request bodies before service calls", async () => {
  const invalidIdCases: Array<[string, (req: Request, res: Response) => Promise<void>]> = [
    ["get character", getCharacterById],
    ["get actions", getCharacterActions],
    ["get derived state", getCharacterDerivedState],
    ["preview derived state", previewCharacterDerivedState],
    ["get defenses", getCharacterDefenses],
    ["get inventory", getCharacterInventory],
    ["update inventory", updateCharacterInventory],
    ["update full inventory", updateCharacterFullInventory],
    ["get inventory state", getCharacterInventoryState],
    ["update inventory state", updateCharacterInventoryState],
    ["update character", updateCharacter],
    ["create dice roll", createCharacterDiceRoll],
    ["add condition", addCharacterCondition],
    ["remove condition", removeCharacterCondition],
    ["delete character", deleteCharacter],
  ];

  for (const [label, controller] of invalidIdCases) {
    const res = createResponse();
    await controller(request({ params: { id: "" } }), res);
    assert.equal(res.statusCode, 400, label);
  }

  const badPreviewResponse = createResponse();
  await previewCharacterDerivedState(
    request({ body: { level: 99 }, params: { id: "character-1" } }),
    badPreviewResponse,
  );
  assert.equal(badPreviewResponse.statusCode, 400);

  const badInventoryResponse = createResponse();
  await updateCharacterInventory(
    request({ body: { items: [{ equipmentIndex: "", equipped: true, quantity: 1 }] }, params: { id: "character-1" } }),
    badInventoryResponse,
  );
  assert.equal(badInventoryResponse.statusCode, 400);

  const badFullInventoryResponse = createResponse();
  await updateCharacterFullInventory(
    request({
      body: { items: [{ equipmentIndex: "rope", equipped: false, quantity: 1 }], stateCode: "" },
      params: { id: "character-1" },
    }),
    badFullInventoryResponse,
  );
  assert.equal(badFullInventoryResponse.statusCode, 400);

  const badInventoryStateResponse = createResponse();
  await updateCharacterInventoryState(
    request({ body: { stateCode: "" }, params: { id: "character-1" } }),
    badInventoryStateResponse,
  );
  assert.equal(badInventoryStateResponse.statusCode, 400);

  const badCreateResponse = createResponse();
  await createCharacter(request({ body: { name: "" } }), badCreateResponse);
  assert.equal(badCreateResponse.statusCode, 400);

  const badUpdateResponse = createResponse();
  await updateCharacter(
    request({ body: { name: "" }, params: { id: "character-1" } }),
    badUpdateResponse,
  );
  assert.equal(badUpdateResponse.statusCode, 400);

  const badDiceRollResponse = createResponse();
  await createCharacterDiceRoll(
    request({ body: { formula: "", rollType: "attack", rollValues: [], total: 0 }, params: { id: "character-1" } }),
    badDiceRollResponse,
  );
  assert.equal(badDiceRollResponse.statusCode, 400);

  const badAddConditionResponse = createResponse();
  await addCharacterCondition(
    request({ body: { conditionIndex: "" }, params: { id: "character-1" } }),
    badAddConditionResponse,
  );
  assert.equal(badAddConditionResponse.statusCode, 400);

  const badRemoveConditionResponse = createResponse();
  await removeCharacterCondition(
    request({ params: { conditionIndex: "", id: "character-1" } }),
    badRemoveConditionResponse,
  );
  assert.equal(badRemoveConditionResponse.statusCode, 400);
});

test("createCharacterDiceRoll maps room-aware service outcomes to HTTP responses", async () => {
  stubPrismaMethod(prisma.character, "findFirst", async () => null);

  const missingCharacterResponse = createResponse();
  await createCharacterDiceRoll(
    request({ body: validDiceRollBody(), params: { id: "character-1" } }),
    missingCharacterResponse,
  );
  assert.equal(missingCharacterResponse.statusCode, 404);
  assert.deepEqual(missingCharacterResponse.body, { error: "Character not found" });

  restorePrismaStubs();
  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async () => null);

  const missingRoomResponse = createResponse();
  await createCharacterDiceRoll(
    request({
      body: validDiceRollBody({ roomCode: "ABC123" }),
      params: { id: "character-1" },
    }),
    missingRoomResponse,
  );
  assert.equal(missingRoomResponse.statusCode, 404);
  assert.deepEqual(missingRoomResponse.body, { error: "Room not found" });

  restorePrismaStubs();
  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async () => ({
    id: "room-1",
    players: [],
  }));

  const forbiddenResponse = createResponse();
  await createCharacterDiceRoll(
    request({
      body: validDiceRollBody({ roomCode: "ABC123" }),
      params: { id: "character-1" },
    }),
    forbiddenResponse,
  );
  assert.equal(forbiddenResponse.statusCode, 403);
  assert.deepEqual(forbiddenResponse.body, { error: "Character is not participating in this room" });

  restorePrismaStubs();
  let createArgs: unknown;
  const diceRoll = {
    characterId: "character-1",
    formula: "1d20 + 5",
    id: "roll-1",
    modifier: 5,
    reason: "Attack",
    rollMode: "normal",
    rollType: "attack",
    rollValues: [{ sides: 20, value: 17 }],
    roomId: "room-1",
    rolledByUserId: "user-1",
    total: 22,
    visibility: "public",
  };
  stubPrismaMethod(prisma.character, "findFirst", async () => ({ id: "character-1" }));
  stubPrismaMethod(prisma.room, "findUnique", async () => ({
    id: "room-1",
    players: [{ id: "player-1" }],
  }));
  stubPrismaMethod(prisma.diceRoll, "create", async (args: unknown) => {
    createArgs = args;

    return diceRoll;
  });

  const successResponse = createResponse();
  await createCharacterDiceRoll(
    request({
      body: validDiceRollBody({ roomCode: "ABC123" }),
      params: { id: "character-1" },
    }),
    successResponse,
  );
  assert.equal(successResponse.statusCode, 201);
  assert.deepEqual(successResponse.body, diceRoll);
  assert.deepEqual(createArgs, {
    data: {
      characterId: "character-1",
      formula: "1d20 + 5",
      modifier: 5,
      reason: "Attack",
      roomId: "room-1",
      rolledByUserId: "user-1",
      rollMode: "normal",
      rollType: "attack",
      rollValues: [{ sides: 20, value: 17 }],
      targetIndex: null,
      targetType: null,
      total: 22,
      visibility: "public",
    },
  });
});

test("getCharacters reports service failures as server errors", async () => {
  const originalError = console.error;
  console.error = () => undefined;

  try {
    const res = createResponse();
    await getCharacters(request(), res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: "Failed to fetch characters" });
  } finally {
    console.error = originalError;
  }
});
