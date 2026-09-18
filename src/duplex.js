import { classifyMessage } from "./protocol.js";
import { supportDecision } from "./support.js";
import { enforceLimits, ConcurrencyGate } from "./limits.js";
import { CorrelationMap } from "./correlation.js";
import { capabilityDecision } from "./capabilities.js";

export function createDuplexHarness(options = {}) {
  const correlation = new CorrelationMap(options.sessionId ?? "session");
  const concurrency = new ConcurrencyGate(options.maxConcurrent ?? 32);
  const limits = options.limits;
  const authorize = options.authorize ?? (() => ({ decision: "allow" }));
  const lifecycle = options.lifecycle ?? null;
  const events = [];
  let closed = false;

  function forward(direction, original) {
    if (closed) throw new Error("harness is closed");
    enforceLimits(original, limits);
    if (lifecycle) lifecycle.assertTrafficAllowed(original);
    const kind = classifyMessage(original);
    const support = supportDecision(direction, original);
    if (!support.supported) {
      events.push({ direction, kind, forwarded: false, reason: support.reason });
      return { forwarded: false, error: { code: -32601, message: support.reason } };
    }
    if (lifecycle && typeof original.method === "string") {
      const negotiated = lifecycle.snapshot().capabilities ?? {};
      const capability = capabilityDecision(original.method, negotiated);
      if (!capability.allowed) {
        events.push({ direction, kind, forwarded: false, reason: capability.reason });
        return { forwarded: false, error: { code: -32601, message: capability.reason } };
      }
    }
        const release = concurrency.enter();
    try {
      const message = structuredClone(original);
      if (kind === "request" && direction === "client-to-server" && message.method === "tools/call") {
        const decision = authorize({ method: message.method, tool: message.params?.name, params: message.params ?? {} });
        if (!decision || decision.decision !== "allow") {
          events.push({ direction, kind, forwarded: false, reason: decision?.reason ?? "authorization denied" });
          return { forwarded: false, error: { code: -32001, message: decision?.reason ?? "authorization denied" } };
        }
      }
      if (kind === "request" && direction === "client-to-server") {
        const downstreamId = message.id;
        message.id = correlation.mapRequest(downstreamId);
        const token = message.params?._meta?.progressToken;
        if (token !== undefined) message.params._meta.progressToken = correlation.mapProgress(downstreamId, token);
      } else if ((kind === "response" || kind === "error") && direction === "server-to-client") {
        const downstreamId = correlation.resolveResponse(message.id);
        if (downstreamId === null) return { forwarded: false, error: { code: -32600, message: "unknown response id" } };
        message.id = downstreamId;
      } else if (kind === "notification" && original.method === "notifications/cancelled") {
        const mapped = correlation.mapCancellation(original.params?.requestId);
        if (mapped === null) return { forwarded: false, error: { code: -32600, message: "unknown cancellation id" } };
        message.params.requestId = mapped;
      } else if (kind === "notification" && direction === "server-to-client" && original.method === "notifications/progress") {
        const mapped = correlation.resolveProgress(original.params?.progressToken);
        if (mapped === null) return { forwarded: false, error: { code: -32600, message: "unknown progress token" } };
        message.params.progressToken = mapped.downstreamToken;
      }
      events.push({ direction, kind, forwarded: true, method: message.method ?? null });
      return { forwarded: true, message };
    } finally {
      release();
    }
  }

  return {
    forward,
    snapshot: () => structuredClone(events),
    close: () => { if (!closed) correlation.close(); closed = true; }
  };
}
