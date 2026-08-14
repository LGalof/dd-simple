import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";

import { login, me, register } from "./auth.controller.js";

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

test("auth controllers reject malformed register and login payloads", async () => {
  const registerResponse = createResponse();
  await register({ body: { email: "bad", password: "short" } } as Request, registerResponse);

  assert.equal(registerResponse.statusCode, 400);
  assert.deepEqual(registerResponse.body, {
    error: "A valid email and password with at least 8 characters are required",
  });

  const displayNameResponse = createResponse();
  await register(
    { body: { displayName: 42, email: "hero@example.com", password: "password123" } } as Request,
    displayNameResponse,
  );

  assert.equal(displayNameResponse.statusCode, 400);
  assert.deepEqual(displayNameResponse.body, { error: "Display name must be text" });

  const loginResponse = createResponse();
  await login({ body: { email: "hero@example.com", password: 123 } } as Request, loginResponse);

  assert.equal(loginResponse.statusCode, 400);
  assert.deepEqual(loginResponse.body, { error: "Email and password are required" });
});

test("me returns the authenticated request user", async () => {
  const res = createResponse();
  const user = { displayName: "Hero", email: "hero@example.com", id: "u1" };

  await me({ user } as unknown as Request, res);

  assert.deepEqual(res.body, { user });
});
