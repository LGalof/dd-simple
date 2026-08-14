import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import {
  getAbilityScores,
  getAlignments,
  getBackgrounds,
  getClasses,
  getConditions,
  getEquipment,
  getProficiencies,
  getRuleDocumentByCategoryAndIndex,
  getRuleDocumentsByCategory,
  getSkills,
  getSpecies,
} from "./reference.controller.js";

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
    statusCode: 200,
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };

  return response as Response & typeof response;
}

test.afterEach(() => {
  restorePrismaStubs();
});

test("reference controllers return reference collections", async () => {
  stubPrismaMethod(prisma.refAbilityScore, "findMany", async () => [{ index: "str" }]);
  stubPrismaMethod(prisma.refSkill, "findMany", async () => [{ index: "athletics" }]);
  stubPrismaMethod(prisma.refAlignment, "findMany", async () => [{ index: "neutral" }]);
  stubPrismaMethod(prisma.refCondition, "findMany", async () => [{ index: "poisoned" }]);
  stubPrismaMethod(prisma.refSpecies, "findMany", async () => [{ index: "human" }]);
  stubPrismaMethod(prisma.refBackground, "findMany", async () => [{ index: "soldier" }]);
  stubPrismaMethod(prisma.refProficiency, "findMany", async () => [{ index: "skill-stealth" }]);
  stubPrismaMethod(prisma.refEquipment, "findMany", async () => [{ index: "longsword" }]);
  stubPrismaMethod(prisma.refClass, "findMany", async () => [
    {
      features: [],
      index: "fighter",
      levels: [],
      name: "Fighter",
      primaryAbilities: [],
    },
  ]);
  stubPrismaMethod(prisma.refRuleDocument, "findMany", async () => []);

  const cases = [
    [getAbilityScores, { index: "str" }],
    [getSkills, { index: "athletics" }],
    [getAlignments, { index: "neutral" }],
    [getConditions, { index: "poisoned" }],
    [getSpecies, { index: "human" }],
    [getBackgrounds, { index: "soldier" }],
    [getProficiencies, { index: "skill-stealth" }],
    [getEquipment, { index: "longsword" }],
  ] as const;

  for (const [controller, expected] of cases) {
    const res = createResponse();

    await controller({} as Request, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [expected]);
  }

  const classesResponse = createResponse();
  await getClasses({} as Request, classesResponse);
  assert.equal(classesResponse.statusCode, 200);
  assert.equal((classesResponse.body as Array<{ index: string }>)[0]?.index, "fighter");
});

test("reference controllers validate rule document params and return rule documents", async () => {
  const categoryResponse = createResponse();
  await getRuleDocumentsByCategory({ params: {} } as Request, categoryResponse);
  assert.equal(categoryResponse.statusCode, 400);

  const indexResponse = createResponse();
  await getRuleDocumentByCategoryAndIndex(
    { params: { category: "features" } } as unknown as Request,
    indexResponse,
  );
  assert.equal(indexResponse.statusCode, 400);

  stubPrismaMethod(prisma.refRuleDocument, "findMany", async () => [
    { category: "features", index: "rage" },
  ]);
  const successCategoryResponse = createResponse();
  await getRuleDocumentsByCategory(
    { params: { category: "features" } } as unknown as Request,
    successCategoryResponse,
  );
  assert.deepEqual(successCategoryResponse.body, [{ category: "features", index: "rage" }]);

  restorePrismaStubs();
  stubPrismaMethod(prisma.refRuleDocument, "findUnique", async () => null);
  const notFoundResponse = createResponse();
  await getRuleDocumentByCategoryAndIndex(
    { params: { category: "features", index: "missing" } } as unknown as Request,
    notFoundResponse,
  );
  assert.equal(notFoundResponse.statusCode, 404);

  restorePrismaStubs();
  stubPrismaMethod(prisma.refRuleDocument, "findUnique", async () => ({
    category: "features",
    index: "rage",
  }));
  const successIndexResponse = createResponse();
  await getRuleDocumentByCategoryAndIndex(
    { params: { category: "features", index: "rage" } } as unknown as Request,
    successIndexResponse,
  );
  assert.deepEqual(successIndexResponse.body, { category: "features", index: "rage" });
});
