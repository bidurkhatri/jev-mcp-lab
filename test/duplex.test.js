import test from "node:test";
import assert from "node:assert/strict";
import { createDuplexHarness } from "../src/duplex.js";

test("maps a request and response end to end", () => {
  const harness = createDuplexHarness({ sessionId: "s" });
  const request = harness.forward("client-to-server", { jsonrpc: "2.0", id: 4, method: "tools/list" });
  assert.equal(request.forwarded, true);
  assert.notEqual(request.message.id, 4);
  const response = harness.forward("server-to-client", { jsonrpc: "2.0", id: request.message.id, result: { tools: [] } });
  assert.equal(response.message.id, 4);
});

test("maps progress and cancellation across links", () => {
  const harness = createDuplexHarness({ sessionId: "s" });
  const request = harness.forward("client-to-server", { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "read", _meta: { progressToken: "local" } } });
  const upstreamToken = request.message.params._meta.progressToken;
  const progress = harness.forward("server-to-client", { jsonrpc: "2.0", method: "notifications/progress", params: { progressToken: upstreamToken, progress: 1 } });
  assert.equal(progress.message.params.progressToken, "local");
  const cancelled = harness.forward("client-to-server", { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 7 } });
  assert.equal(cancelled.message.params.requestId, request.message.id);
});

test("unknown responses, progress and cancellation fail explicitly", () => {
  const harness = createDuplexHarness();
  assert.equal(harness.forward("server-to-client", { jsonrpc: "2.0", id: "x", result: {} }).forwarded, false);
  assert.equal(harness.forward("server-to-client", { jsonrpc: "2.0", method: "notifications/progress", params: { progressToken: "x" } }).forwarded, false);
  assert.equal(harness.forward("client-to-server", { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: "x" } }).forwarded, false);
});

test("unsupported methods fail with method-not-found", () => {
  const harness = createDuplexHarness();
  const result = harness.forward("server-to-client", { jsonrpc: "2.0", id: 1, method: "future/unknown" });
  assert.equal(result.forwarded, false);
  assert.equal(result.error.code, -32601);
});

test("limits are enforced before mapping", () => {
  const harness = createDuplexHarness({ limits: { maxMessageBytes: 20 } });
  assert.throws(() => harness.forward("client-to-server", { jsonrpc: "2.0", id: 1, method: "tools/list" }), /byte limit/);
});

test("close rejects later traffic and snapshot is isolated", () => {
  const harness = createDuplexHarness();
  harness.forward("client-to-server", { jsonrpc: "2.0", id: 1, method: "tools/list" });
  const events = harness.snapshot(); events[0].forwarded = false;
  assert.equal(harness.snapshot()[0].forwarded, true);
  harness.close();
  assert.throws(() => harness.forward("client-to-server", { jsonrpc: "2.0", id: 2, method: "tools/list" }), /closed/);
});

test("deterministic authorization blocks a tool call before forwarding", () => {
  const harness = createDuplexHarness({ authorize: () => ({ decision: "deny", reason: "policy" }) });
  const result = harness.forward("client-to-server", { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "shell" } });
  assert.equal(result.forwarded, false);
  assert.equal(result.error.code, -32001);
});

import { Lifecycle } from "../src/lifecycle.js";

test("optional lifecycle blocks traffic before ready", () => {
  const lifecycle = new Lifecycle();
  const harness = createDuplexHarness({ lifecycle });
  assert.throws(() => harness.forward("client-to-server", { jsonrpc: "2.0", id: 1, method: "tools/list" }), /lifecycle is new/);
});

test("optional negotiated capabilities block unadvertised methods", () => {
  const lifecycle = new Lifecycle();
  lifecycle.beginInitialize({ method: "initialize", params: { protocolVersion: "2025-06-18" } });
  lifecycle.acceptInitialize({ protocolVersion: "2025-06-18", capabilities: { tools: {} } }, ["2025-06-18"]);
  lifecycle.initialized();
  const harness = createDuplexHarness({ lifecycle });
  assert.equal(harness.forward("client-to-server", { jsonrpc: "2.0", id: 1, method: "tools/list" }).forwarded, true);
  const prompts = harness.forward("client-to-server", { jsonrpc: "2.0", id: 2, method: "prompts/list" });
  assert.equal(prompts.forwarded, false);
  assert.match(prompts.error.message, /not negotiated/);
});
