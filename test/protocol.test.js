import test from "node:test";
import assert from "node:assert/strict";
import { classifyMessage, replayFixture, validateFixture } from "../src/protocol.js";

const base = {
  fixtureVersion: 1,
  protocolVersion: "2025-06-18",
  direction: "client-to-server",
  transport: "stdio",
  expected: { forward: true, decision: "allow" }
};

test("classifies every JSON-RPC envelope kind", () => {
  assert.equal(classifyMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }), "request");
  assert.equal(classifyMessage({ jsonrpc: "2.0", method: "notifications/cancelled" }), "notification");
  assert.equal(classifyMessage({ jsonrpc: "2.0", id: 1, result: {} }), "response");
  assert.equal(classifyMessage({ jsonrpc: "2.0", id: 1, error: { code: -1, message: "x" } }), "error");
});

test("rejects ambiguous or malformed envelopes", () => {
  assert.throws(() => classifyMessage({ jsonrpc: "2.0", id: 1, result: {}, error: {} }));
  assert.throws(() => classifyMessage({ jsonrpc: "1.0", id: 1, result: {} }));
  assert.throws(() => classifyMessage({ jsonrpc: "2.0" }));
});

test("validates fixture metadata", () => {
  const fixture = validateFixture({ ...base, message: { jsonrpc: "2.0", id: 1, method: "tools/list" } });
  assert.equal(fixture.kind, "request");
});

test("replay calls authorization only at client request boundary", () => {
  const request = { ...base, message: { jsonrpc: "2.0", id: 1, method: "tools/list" } };
  let calls = 0;
  const result = replayFixture(request, () => { calls++; return { decision: "allow" }; });
  assert.equal(calls, 1);
  assert.equal(result.matches, true);

  const notification = {
    ...base,
    direction: "server-to-client",
    expected: { forward: true, decision: "not-applicable" },
    message: { jsonrpc: "2.0", method: "notifications/progress", params: { progressToken: "p", progress: 1 } }
  };
  replayFixture(notification, () => { calls++; return { decision: "deny" }; });
  assert.equal(calls, 1);
});

test("fixture replay never mutates the recorded message", () => {
  const fixture = { ...base, message: { jsonrpc: "2.0", id: 1, method: "tools/list", params: { cursor: "x" } } };
  const before = JSON.stringify(fixture);
  replayFixture(fixture, () => ({ decision: "allow" }));
  assert.equal(JSON.stringify(fixture), before);
});
