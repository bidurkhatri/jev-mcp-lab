import test from "node:test";
import assert from "node:assert/strict";
import { compilePolicy } from "../src/policy.js";
import { decideWithAdvisory, queryAdvisory } from "../src/advisory.js";

const policy = compilePolicy({ version: 1, rules: [
  { id: "allow-read", effect: "allow", match: { method: "tools/call", tool: "read" } }
] });

test("disabled advisory provider is explicit", async () => {
  assert.deepEqual(await queryAdvisory(null, {}), { status: "disabled", value: null });
});

test("provider input is isolated from the authorization request", async () => {
  const request = { method: "tools/call", tool: "read", nested: { value: 1 } };
  await queryAdvisory((copy) => { copy.nested.value = 2; return { label: "ok" }; }, request);
  assert.equal(request.nested.value, 1);
});

test("advisory failure cannot change an allow", async () => {
  const result = await decideWithAdvisory(policy, { method: "tools/call", tool: "read" }, async () => { throw new Error("offline"); });
  assert.equal(result.decision, "allow");
  assert.equal(result.advisoryStatus, "error");
  assert.equal(result.advisoryInfluencedDecision, false);
});

test("unsafe advisory answer cannot change a deny", async () => {
  const result = await decideWithAdvisory(policy, { method: "tools/call", tool: "shell" }, async () => ({ label: "allow", probability: 1 }));
  assert.equal(result.decision, "deny");
  assert.equal(result.advisory.label, "allow");
  assert.equal(result.advisoryInfluencedDecision, false);
});

test("advisory timeout is bounded and cannot change authorization", async () => {
  const provider = (_input, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const result = await decideWithAdvisory(policy, { method: "tools/call", tool: "read" }, provider, { timeoutMs: 10 });
  assert.equal(result.decision, "allow");
  assert.equal(result.advisoryError, "AdvisoryTimeoutError");
});
