import test from "node:test";
import assert from "node:assert/strict";
import { HttpSessionStore, selectResponseType, validateOrigin } from "../src/http-session.js";

test("requires a known live MCP session ID", () => {
  const store = new HttpSessionStore();
  const id = store.create({ protocolVersion: "2025-06-18" });
  assert.equal(store.require({ "MCP-Session-Id": id }).metadata.protocolVersion, "2025-06-18");
  assert.throws(() => store.require({}), (error) => error.status === 400);
  assert.throws(() => store.require({ "mcp-session-id": "unknown" }), (error) => error.status === 404);
});

test("session close is enforced", () => {
  const store = new HttpSessionStore();
  const id = store.create();
  store.close({ "mcp-session-id": id });
  assert.throws(() => store.require({ "mcp-session-id": id }), /unknown MCP session/);
});

test("resume keeps Last-Event-ID separate from server event state", () => {
  const store = new HttpSessionStore();
  const id = store.create();
  store.recordEvent(id, "server-8");
  const resumed = store.resume({ "mcp-session-id": id, "last-event-id": "client-5" });
  assert.equal(resumed.lastEventId, "server-8");
  assert.equal(resumed.resumeAfter, "client-5");
});

test("origin validation uses exact normalized origins", () => {
  assert.equal(validateOrigin("https://client.example/path", ["https://client.example"]), "https://client.example");
  assert.throws(() => validateOrigin("https://client.example.evil", ["https://client.example"]), (error) => error.status === 403);
  assert.throws(() => validateOrigin("", ["https://client.example"]), /missing Origin/);
});

test("negotiates JSON or event-stream responses", () => {
  assert.equal(selectResponseType("application/json"), "application/json");
  assert.equal(selectResponseType("text/event-stream, application/json"), "text/event-stream");
  assert.throws(() => selectResponseType("text/plain"), (error) => error.status === 406);
});

import { validateHttpRequest, validateProtocolVersion } from "../src/http-session.js";

test("requires a supported MCP protocol version by default", () => {
  assert.equal(validateProtocolVersion({ "mcp-protocol-version": "2025-06-18" }, ["2025-06-18"]), "2025-06-18");
  assert.throws(() => validateProtocolVersion({}, ["2025-06-18"]), (error) => error.status === 400);
  assert.throws(() => validateProtocolVersion({ "mcp-protocol-version": "future" }, ["2025-06-18"]), /unsupported/);
});

test("validates POST framing and transport headers", () => {
  const request = { method: "POST", headers: {
    origin: "https://client.example", "mcp-protocol-version": "2025-06-18",
    "content-type": "application/json; charset=utf-8", accept: "application/json, text/event-stream"
  } };
  assert.deepEqual(validateHttpRequest(request, { allowedOrigins: ["https://client.example"], supportedVersions: ["2025-06-18"] }), {
    method: "POST", protocolVersion: "2025-06-18"
  });
  assert.throws(() => validateHttpRequest({ ...request, headers: { ...request.headers, "content-type": "text/plain" } }, { allowedOrigins: ["https://client.example"], supportedVersions: ["2025-06-18"] }), (error) => error.status === 415);
});

test("GET requires event-stream and unknown methods return 405", () => {
  const options = { allowedOrigins: ["https://client.example"], supportedVersions: ["2025-06-18"] };
  const headers = { origin: "https://client.example", "mcp-protocol-version": "2025-06-18", accept: "text/event-stream" };
  assert.equal(validateHttpRequest({ method: "GET", headers }, options).method, "GET");
  assert.throws(() => validateHttpRequest({ method: "GET", headers: { ...headers, accept: "application/json" } }, options), (error) => error.status === 406);
  assert.throws(() => validateHttpRequest({ method: "PUT", headers }, options), (error) => error.status === 405);
});
