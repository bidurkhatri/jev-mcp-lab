import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

test("public candidate preflight preserves owner gates", async () => {
  const { stdout } = await exec(process.execPath, ["scripts/release-check.js"]);
  const result = JSON.parse(stdout);
  assert.equal(result.candidatePreflightPassed, true);
  assert.equal(result.readyToPublish, false);
  assert.deepEqual(result.failures, []);
  assert.ok(result.ownerGates.includes("license"));
});
