import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

test("public repository hygiene check passes", async () => {
  const { stdout } = await exec(process.execPath, ["scripts/release-check.js"]);
  const result = JSON.parse(stdout);
  assert.equal(result.repositoryCheckPassed, true);
  assert.deepEqual(result.failures, []);
});
