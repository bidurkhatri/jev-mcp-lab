const DIRECTIONS = new Set(["client-to-server", "server-to-client"]);
const TRANSPORTS = new Set(["stdio", "streamable-http", "sse-legacy"]);

export function classifyMessage(message) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    throw new TypeError("JSON-RPC message must be an object");
  }
  if (message.jsonrpc !== "2.0") throw new TypeError("jsonrpc must be 2.0");
  const hasMethod = typeof message.method === "string" && message.method.length > 0;
  const hasId = Object.hasOwn(message, "id");
  const hasResult = Object.hasOwn(message, "result");
  const hasError = Object.hasOwn(message, "error");
  if (hasMethod) {
    if (hasResult || hasError) throw new TypeError("request/notification cannot contain result or error");
    return hasId ? "request" : "notification";
  }
  if (!hasId) throw new TypeError("response must contain id");
  if (hasResult === hasError) throw new TypeError("response must contain exactly one of result or error");
  return hasError ? "error" : "response";
}

export function validateFixture(fixture) {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) throw new TypeError("fixture must be an object");
  if (fixture.fixtureVersion !== 1) throw new TypeError("fixtureVersion must be 1");
  if (typeof fixture.protocolVersion !== "string" || !fixture.protocolVersion) throw new TypeError("protocolVersion is required");
  if (!DIRECTIONS.has(fixture.direction)) throw new TypeError("invalid direction");
  if (fixture.transport !== undefined && !TRANSPORTS.has(fixture.transport)) throw new TypeError("invalid transport");
  const kind = classifyMessage(fixture.message);
  const expected = fixture.expected;
  if (!expected || typeof expected !== "object" || typeof expected.forward !== "boolean") {
    throw new TypeError("expected.forward is required");
  }
  if (!["allow", "deny", "not-applicable"].includes(expected.decision)) throw new TypeError("invalid expected.decision");
  return Object.freeze({ ...fixture, kind });
}

export function replayFixture(fixture, authorize) {
  const valid = validateFixture(fixture);
  const message = structuredClone(valid.message);
  let actual;
  if (valid.kind === "request" && valid.direction === "client-to-server") {
    actual = authorize({ method: message.method, params: message.params ?? {}, id: message.id });
  } else {
    actual = { decision: "not-applicable", reason: "message is outside the authorization point" };
  }
  return {
    kind: valid.kind,
    actual,
    matches: actual.decision === valid.expected.decision,
    forwarded: actual.decision !== "deny" && valid.expected.forward
  };
}
