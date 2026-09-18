import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateFixture } from "../src/protocol.js";

const directory = new URL("../fixtures/cases/", import.meta.url);

test("every checked-in fixture validates", async () => {
  const files = (await readdir(directory)).filter((name) => name.endsWith(".json"));
  assert.ok(files.length >= 7);
  for (const file of files) {
    const fixture = JSON.parse(await readFile(join(directory.pathname, file), "utf8"));
    assert.doesNotThrow(() => validateFixture(fixture), file);
  }
});
