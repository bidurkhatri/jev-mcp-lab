import test from "node:test";
import assert from "node:assert/strict";
import { Lifecycle } from "../src/lifecycle.js";

const initialize = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {} } };

test("requires ordered initialization before ordinary traffic", () => {
  const life = new Lifecycle();
  assert.throws(() => life.assertTrafficAllowed({ method: "tools/list" }), /new/);
  life.beginInitialize(initialize);
  assert.throws(() => life.assertTrafficAllowed({ method: "tools/list" }), /initializing/);
  life.acceptInitialize({ protocolVersion: "2025-06-18", capabilities: { tools: {} } }, ["2025-06-18"]);
  life.initialized();
  assert.equal(life.assertTrafficAllowed({ method: "tools/list" }), true);
});

test("rejects unsupported negotiated versions and closes", () => {
  const life = new Lifecycle();
  life.beginInitialize(initialize);
  assert.throws(() => life.acceptInitialize({ protocolVersion: "future", capabilities: {} }, ["2025-06-18"]), /unsupported/);
  assert.equal(life.snapshot().state, "closed");
});

test("does not become ready before accepting initialize response", () => {
  const life = new Lifecycle();
  life.beginInitialize(initialize);
  assert.throws(() => life.initialized(), /not accepted/);
});

test("capabilities are cloned at ingress and snapshot", () => {
  const life = new Lifecycle();
  const capabilities = { tools: { listChanged: true } };
  life.beginInitialize(initialize);
  life.acceptInitialize({ protocolVersion: "2025-06-18", capabilities }, ["2025-06-18"]);
  capabilities.tools.listChanged = false;
  const snapshot = life.snapshot();
  assert.equal(snapshot.capabilities.tools.listChanged, true);
  snapshot.capabilities.tools.listChanged = false;
  assert.equal(life.snapshot().capabilities.tools.listChanged, true);
});

test("close is idempotent", () => {
  const life = new Lifecycle();
  assert.equal(life.close(), true);
  assert.equal(life.close(), false);
});
