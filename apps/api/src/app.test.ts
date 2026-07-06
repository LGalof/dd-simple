import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { app } from "./app.js";

test("serves the frontend entrypoint and built assets for auth routes", async () => {
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));

    const address = server.address();
    assert.ok(address && typeof address === "object" && "port" in address);

    const authResponse = await fetch(`http://127.0.0.1:${address.port}/prijava`);
    const authHtml = await authResponse.text();

    assert.equal(authResponse.status, 200);
    assert.match(authHtml, /<div id="root">/i);

    const assetsDir = path.resolve(process.cwd(), "../web/dist/assets");
    const assetFiles = (await readdir(assetsDir)).filter((name) => name.endsWith(".js") || name.endsWith(".css"));
    assert.ok(assetFiles.length > 0);

    const assetResponse = await fetch(`http://127.0.0.1:${address.port}/assets/${assetFiles[0]}`);
    assert.equal(assetResponse.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
