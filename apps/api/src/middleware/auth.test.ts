import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { requireAuth } from "./auth.js";

test("requireAuth returns a friendly HTML page for missing authentication", async () => {
  let statusCode: number | undefined;
  let contentType: string | undefined;
  let body: string | undefined;

  const req = {
    accepts: () => "html",
    header: () => undefined,
  } as unknown as Request;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    type(value: string) {
      contentType = value;
      return this;
    },
    send(payload: string) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  const next = () => {
    throw new Error("next should not be called");
  };

  await requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.equal(contentType, "html");
  assert.match(body ?? "", /Prijava potrebna/);
});
