import test from "node:test";
import assert from "node:assert/strict";
import { redact } from "../src/redact.js";
import { appendAudit } from "../src/audit.js";

test("redacts nested credential-bearing keys", () => {
  const source = { headers: { authorization: "Bearer x", cookie: "a=b" }, args: { password: "p", safe: "ok" } };
  const result = redact(source);
  assert.equal(result.headers.authorization, "[REDACTED]");
  assert.equal(result.headers.cookie, "[REDACTED]");
  assert.equal(result.args.password, "[REDACTED]");
  assert.equal(result.args.safe, "ok");
});

test("does not mutate the source", () => {
  const source = { token: "x" };
  redact(source);
  assert.equal(source.token, "x");
});

test("audit chain stores the redacted event", () => {
  const record = appendAudit(null, { authorization: "Bearer x", decision: "deny" });
  assert.equal(record.event.authorization, "[REDACTED]");
  assert.equal(record.event.decision, "deny");
  assert.doesNotMatch(JSON.stringify(record), /Bearer x/);
});

test("handles circular values without leaking or recursing forever", () => {
  const value = { safe: true };
  value.self = value;
  assert.equal(redact(value).self, "[REDACTED:CIRCULAR]");
});
