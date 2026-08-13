import assert from "node:assert/strict";
import test from "node:test";
import { resolveAuthSecret } from "./auth-config.js";

test("requires AUTH_SECRET in production", () => {
  assert.throws(
    () => resolveAuthSecret({ NODE_ENV: "production" }),
    /AUTH_SECRET must be set when NODE_ENV=production/,
  );
  assert.throws(
    () => resolveAuthSecret({ AUTH_SECRET: "   ", NODE_ENV: "production" }),
    /AUTH_SECRET must be set when NODE_ENV=production/,
  );
});

test("uses the configured AUTH_SECRET", () => {
  assert.equal(
    resolveAuthSecret({ AUTH_SECRET: "  configured-secret  ", NODE_ENV: "production" }),
    "configured-secret",
  );
});

test("keeps the fallback secret outside production", () => {
  assert.equal(
    resolveAuthSecret({ NODE_ENV: "development" }),
    "dd-simple-local-development-secret",
  );
});
