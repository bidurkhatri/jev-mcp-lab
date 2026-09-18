import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadPolicy } from "../src/load-policy.js";

test("loads and compiles a valid policy", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mcp-policy-fixtures-"));
  const path = join(dir, "policy.json");
  await writeFile(path, JSON.stringify({ version: 1, rules: [] }));
  assert.equal((await loadPolicy(path)).version, 1);
});

test("invalid JSON fails closed", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mcp-policy-fixtures-"));
  const path = join(dir, "policy.json");
  await writeFile(path, "{");
  await assert.rejects(loadPolicy(path), /invalid policy JSON/);
});

test("missing policy fails closed", async () => {
  await assert.rejects(loadPolicy("/path/that/does/not/exist"), /cannot read policy/);
});
