import test from "node:test";
import assert from "node:assert/strict";
import { supportDecision } from "../src/support.js";
import { validateContentBlock } from "../src/content.js";

test("explicitly supports selected methods in each direction", () => {
  assert.equal(supportDecision("client-to-server", { jsonrpc: "2.0", id: 1, method: "tools/call" }).supported, true);
  assert.equal(supportDecision("server-to-client", { jsonrpc: "2.0", id: 1, method: "sampling/createMessage" }).supported, true);
});

test("unknown methods fail explicitly instead of disappearing", () => {
  assert.deepEqual(supportDecision("server-to-client", { jsonrpc: "2.0", id: 1, method: "future/unknown" }), {
    supported: false, reason: "unsupported server-to-client method: future/unknown"
  });
});

test("responses and errors do not need a method allowlist", () => {
  assert.equal(supportDecision("client-to-server", { jsonrpc: "2.0", id: 1, result: {} }).supported, true);
});

test("accepts text, image, audio, resource and resource links", () => {
  assert.equal(validateContentBlock({ type: "text", text: "x" }).type, "text");
  assert.equal(validateContentBlock({ type: "image", data: "AA==", mimeType: "image/png" }).type, "image");
  assert.equal(validateContentBlock({ type: "audio", data: "AA==", mimeType: "audio/wav" }).type, "audio");
  assert.equal(validateContentBlock({ type: "resource", resource: { uri: "file:///x" } }).type, "resource");
  assert.equal(validateContentBlock({ type: "resource_link", uri: "https://example.invalid/x" }).type, "resource_link");
});

test("rejects unknown or malformed content blocks", () => {
  assert.throws(() => validateContentBlock({ type: "video", data: "x" }), /unsupported/);
  assert.throws(() => validateContentBlock({ type: "image", data: "x" }), /mimeType/);
});
