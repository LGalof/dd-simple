import test from "node:test";
import assert from "node:assert/strict";
import { app } from "./app.js";

test("serves the frontend entrypoint for auth routes", async () => {
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));

    const address = server.address();
    assert.ok(address && typeof address === "object" && "port" in address);

    const response = await fetch(`http://127.0.0.1:${address.port}/prijava`);
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.match(text, /<div id="root">/i);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
