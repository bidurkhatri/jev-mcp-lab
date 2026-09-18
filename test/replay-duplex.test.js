import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

test("checked-in fixtures match duplex forwarding expectations", async () => {
  const { stdout } = await exec(process.execPath, ["scripts/replay-duplex.js"]);
  const result = JSON.parse(stdout);
  assert.equal(result.failed, 0);
  assert.ok(result.total >= 9);
});
