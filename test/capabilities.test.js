import test from "node:test";
import assert from "node:assert/strict";
import { capabilityDecision } from "../src/capabilities.js";

test("allows only negotiated capability methods", () => {
  assert.equal(capabilityDecision("tools/call", { tools: {} }).allowed, true);
  assert.equal(capabilityDecision("tools/call", {}).allowed, false);
  assert.equal(capabilityDecision("sampling/createMessage", { sampling: {} }).allowed, true);
});

test("lifecycle methods have no capability gate", () => {
  assert.equal(capabilityDecision("initialize", {}).allowed, true);
  assert.equal(capabilityDecision("ping", {}).allowed, true);
});
