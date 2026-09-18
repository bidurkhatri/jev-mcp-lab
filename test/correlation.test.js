import test from "node:test";
import assert from "node:assert/strict";
import { CorrelationMap } from "../src/correlation.js";

test("maps request and response IDs without collisions", () => {
  const map = new CorrelationMap("s1");
  const a = map.mapRequest(1);
  const b = map.mapRequest("1");
  assert.notEqual(a, b);
  assert.equal(map.resolveResponse(a), 1);
  assert.equal(map.resolveResponse(b), "1");
});

test("rejects duplicate active downstream IDs", () => {
  const map = new CorrelationMap("s1");
  map.mapRequest(1);
  assert.throws(() => map.mapRequest(1), /already active/);
});

test("maps cancellation only for an active request", () => {
  const map = new CorrelationMap("s1");
  const upstream = map.mapRequest(7);
  assert.equal(map.mapCancellation(7), upstream);
  map.resolveResponse(upstream);
  assert.equal(map.mapCancellation(7), null);
});

test("progress tokens are link-local and map back to the request", () => {
  const map = new CorrelationMap("s1");
  map.mapRequest(4);
  const token = map.mapProgress(4, "client-token");
  assert.deepEqual(map.resolveProgress(token), { downstreamId: 4, downstreamToken: "client-token" });
});

test("completing a request removes its progress mappings", () => {
  const map = new CorrelationMap("s1");
  const upstream = map.mapRequest(4);
  const token = map.mapProgress(4, "client-token");
  map.resolveResponse(upstream);
  assert.equal(map.resolveProgress(token), null);
});

test("closed sessions reject use and forget all correlations", () => {
  const map = new CorrelationMap("s1");
  map.mapRequest(1);
  map.close();
  assert.throws(() => map.mapRequest(2), /closed/);
  assert.throws(() => map.mapCancellation(1), /closed/);
});

test("separate sessions cannot collide", () => {
  const a = new CorrelationMap("a");
  const b = new CorrelationMap("b");
  assert.notEqual(a.mapRequest(1), b.mapRequest(1));
});
