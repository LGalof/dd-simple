import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthError,
  base64UrlDecode,
  base64UrlEncode,
  createAuthToken,
  hashPassword,
  toAuthUser,
  verifyAuthToken,
  verifyPassword,
} from "./auth.service.js";

const user = {
  displayName: "Mira",
  email: "mira@example.com",
  id: "user-1",
};

test("auth helpers map users and encode url-safe payloads", () => {
  assert.deepEqual(toAuthUser({ ...user, passwordHash: "secret" } as never), user);
  assert.equal(base64UrlDecode(base64UrlEncode("hello world")), "hello world");
});

test("auth tokens round-trip valid payloads and reject malformed tokens", () => {
  const token = createAuthToken(user);
  const payload = verifyAuthToken(token);

  assert.equal(payload.sub, user.id);
  assert.equal(payload.email, user.email);
  assert.equal(typeof payload.exp, "number");

  assert.throws(() => verifyAuthToken("missing-parts"), AuthError);
  assert.throws(() => verifyAuthToken(`${token.split(".")[0]}.bad-signature`), AuthError);
});

test("auth password helpers verify scrypt hashes and reject invalid hash formats", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("correct horse battery staple", "plain"), false);
  assert.equal(
    await verifyPassword("correct horse battery staple", "bcrypt:salt:hash"),
    false,
  );
});
