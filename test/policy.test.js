import test from "node:test";
import assert from "node:assert/strict";
import { compilePolicy, evaluate, gate } from "../src/policy.js";

const policy = compilePolicy({ version: 1, rules: [
  { id: "deny-shell", effect: "deny", match: { method: "tools/call", tool: "shell" } },
  { id: "allow-read", effect: "allow", match: { method: "tools/call", tool: ["read_file", "list_files"] } }
] });

test("default is deny", () => {
  assert.deepEqual(evaluate(policy, { method: "tools/call", tool: "unknown" }), {
    decision: "deny", ruleId: null, reason: "no allow rule matched"
  });
});

test("explicit deny wins regardless of order", () => {
  const overlap = compilePolicy({ version: 1, rules: [
    { id: "broad-allow", effect: "allow", match: { method: "tools/call" } },
    { id: "specific-deny", effect: "deny", match: { method: "tools/call", tool: "shell" } }
  ] });
  assert.equal(evaluate(overlap, { method: "tools/call", tool: "shell" }).decision, "deny");
});

test("advisory output is recorded but never changes authorization", () => {
  const result = gate(policy, { method: "tools/call", tool: "shell" }, { score: 0.99, label: "safe" });
  assert.equal(result.decision, "deny");
  assert.equal(result.advisoryInfluencedDecision, false);
  assert.equal(result.advisory.label, "safe");
});

test("matching allow passes", () => {
  assert.equal(evaluate(policy, { method: "tools/call", tool: "read_file" }).decision, "allow");
});

test("malformed policies fail closed at compile time", () => {
  assert.throws(() => compilePolicy({ version: 1, rules: [{ id: "x", effect: "maybe", match: {} }] }));
});
