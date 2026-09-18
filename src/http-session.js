import { randomUUID } from "node:crypto";

const SESSION_HEADER = "mcp-session-id";
const LAST_EVENT_HEADER = "last-event-id";

export class HttpSessionStore {
  #sessions = new Map();
  create(metadata = {}) {
    const id = randomUUID();
    this.#sessions.set(id, { metadata: structuredClone(metadata), lastEventId: null, closed: false });
    return id;
  }
  require(headers) {
    const id = header(headers, SESSION_HEADER);
    if (!id) throw sessionError(400, "missing MCP-Session-Id");
    const session = this.#sessions.get(id);
    if (!session || session.closed) throw sessionError(404, "unknown MCP session");
    return { id, metadata: structuredClone(session.metadata), lastEventId: session.lastEventId };
  }
  recordEvent(id, eventId) {
    const session = this.#sessions.get(id);
    if (!session || session.closed) throw sessionError(404, "unknown MCP session");
    if (typeof eventId !== "string" || !eventId) throw new TypeError("eventId is required");
    session.lastEventId = eventId;
  }
  resume(headers) {
    const session = this.require(headers);
    const lastEventId = header(headers, LAST_EVENT_HEADER);
    return { ...session, resumeAfter: lastEventId ?? null };
  }
  close(headers) {
    const { id } = this.require(headers);
    this.#sessions.get(id).closed = true;
    return id;
  }
}

export function validateOrigin(origin, allowedOrigins) {
  if (typeof origin !== "string" || !origin) throw sessionError(403, "missing Origin");
  let normalized;
  try { normalized = new URL(origin).origin; } catch { throw sessionError(403, "invalid Origin"); }
  if (!allowedOrigins.includes(normalized)) throw sessionError(403, "Origin is not allowed");
  return normalized;
}

export function selectResponseType(accept) {
  const types = String(accept ?? "").split(",").map((part) => part.split(";", 1)[0].trim().toLowerCase());
  if (types.includes("text/event-stream")) return "text/event-stream";
  if (types.includes("application/json") || types.includes("*/*")) return "application/json";
  throw sessionError(406, "Accept must include application/json or text/event-stream");
}

function header(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name);
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return found?.[1] == null ? null : String(found[1]);
}

function sessionError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function validateProtocolVersion(headers, supportedVersions, options = {}) {
  const raw = header(headers, "mcp-protocol-version");
  if (!raw) {
    if (options.allowLegacyDefault === true) return options.legacyDefault ?? "2025-03-26";
    throw sessionError(400, "missing MCP-Protocol-Version");
  }
  if (!supportedVersions.includes(raw)) throw sessionError(400, `unsupported MCP protocol version: ${raw}`);
  return raw;
}

export function validateHttpRequest(request, options) {
  const method = String(request?.method ?? "").toUpperCase();
  if (!["POST", "GET", "DELETE"].includes(method)) throw sessionError(405, "method is not allowed");
  validateOrigin(header(request.headers, "origin"), options.allowedOrigins);
  const protocolVersion = validateProtocolVersion(request.headers, options.supportedVersions, options);
  if (method === "POST") {
    const contentType = header(request.headers, "content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") throw sessionError(415, "Content-Type must be application/json");
    selectResponseType(header(request.headers, "accept"));
  }
  if (method === "GET" && selectResponseType(header(request.headers, "accept")) !== "text/event-stream") {
    throw sessionError(406, "GET requires text/event-stream");
  }
  return { method, protocolVersion };
}
