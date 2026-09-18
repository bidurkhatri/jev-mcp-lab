import test from "node:test";
import assert from "node:assert/strict";
import { appendAudit, verifyAudit } from "../src/audit.js";

test("audit records form a verifiable hash chain", () => {
  const first = appendAudit(null, { decision: "deny", requestId: "1" });
  const second = appendAudit(first.hash, { requestId: "2", decision: "allow" });
  assert.equal(verifyAudit([first, second]), true);
});

test("audit hash is stable across object key order", () => {
  const a = appendAudit(null, { decision: "deny", requestId: "1" });
  const b = appendAudit(null, { requestId: "1", decision: "deny" });
  assert.equal(a.hash, b.hash);
});

test("tampering is detected", () => {
  const first = appendAudit(null, { decision: "deny" });
  assert.equal(verifyAudit([{ ...first, event: { decision: "allow" } }]), false);
});
