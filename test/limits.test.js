import test from "node:test";
import assert from "node:assert/strict";
import { ConcurrencyGate, enforceLimits, measureUtf8 } from "../src/limits.js";

test("measures UTF-8 bytes rather than code units", () => {
  assert.equal(measureUtf8("💡"), 4);
});

test("rejects oversized messages", () => {
  assert.throws(() => enforceLimits("12345", { maxMessageBytes: 4 }), /byte limit/);
});

test("rejects excessive depth, keys, arrays and cycles", () => {
  assert.throws(() => enforceLimits({ a: { b: { c: 1 } } }, { maxDepth: 1 }), /depth/);
  assert.throws(() => enforceLimits({ a: 1, b: 2 }, { maxObjectKeys: 1 }), /key limit/);
  assert.throws(() => enforceLimits([1, 2], { maxArrayItems: 1 }), /item limit/);
  const cycle = {}; cycle.self = cycle;
  assert.throws(() => enforceLimits(cycle), /cycle/);
});

test("accepts bounded messages and reports bytes", () => {
  const input = { method: "tools/list" };
  assert.equal(enforceLimits(input).bytes, Buffer.byteLength(JSON.stringify(input)));
});

test("concurrency gate rejects overflow and release is idempotent", () => {
  const gate = new ConcurrencyGate(1);
  const release = gate.enter();
  assert.equal(gate.active, 1);
  assert.throws(() => gate.enter(), /concurrency/);
  assert.equal(release(), true);
  assert.equal(release(), false);
  assert.equal(gate.active, 0);
});
