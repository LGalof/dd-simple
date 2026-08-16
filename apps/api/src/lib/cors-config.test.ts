import test from "node:test";
import assert from "node:assert/strict";
import { getAllowedOrigins, isAllowedOrigin } from "./cors-config.js";

test("uses explicit comma-separated CORS origins", () => {
  const previousValue = process.env.CORS_ALLOWED_ORIGINS;

  try {
    process.env.CORS_ALLOWED_ORIGINS = "https://dd-simple.onrender.com, https://example.com";
    const origins = getAllowedOrigins();

    assert.equal(origins.has("https://dd-simple.onrender.com"), true);
    assert.equal(origins.has("https://example.com"), true);
    assert.equal(isAllowedOrigin("https://attacker.example", origins), false);
  } finally {
    if (previousValue === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = previousValue;
  }
});

test("allows requests without an Origin header", () => {
  assert.equal(isAllowedOrigin(undefined, new Set()), true);
});

test("uses the production origin when no explicit CORS origins are configured", () => {
  const previousOrigins = process.env.CORS_ALLOWED_ORIGINS;
  const previousNodeEnvironment = process.env.NODE_ENV;

  try {
    delete process.env.CORS_ALLOWED_ORIGINS;
    process.env.NODE_ENV = "production";

    const origins = getAllowedOrigins();

    assert.deepEqual([...origins], ["https://dd-simple.onrender.com"]);
    assert.equal(isAllowedOrigin("https://dd-simple.onrender.com", origins), true);
  } finally {
    if (previousOrigins === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = previousOrigins;

    if (previousNodeEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnvironment;
  }
});
