export class CorrelationMap {
  #nextId = 1;
  #downstreamToUpstream = new Map();
  #upstreamToDownstream = new Map();
  #progress = new Map();
  #closed = false;

  constructor(sessionId) {
    if (typeof sessionId !== "string" || !sessionId) throw new TypeError("sessionId is required");
    this.sessionId = sessionId;
  }

  mapRequest(downstreamId) {
    this.#assertOpen();
    this.#assertId(downstreamId);
    if (this.#downstreamToUpstream.has(downstreamId)) throw new Error("downstream request id is already active");
    const upstreamId = `${this.sessionId}:${this.#nextId++}`;
    this.#downstreamToUpstream.set(downstreamId, upstreamId);
    this.#upstreamToDownstream.set(upstreamId, downstreamId);
    return upstreamId;
  }

  resolveResponse(upstreamId) {
    this.#assertOpen();
    if (!this.#upstreamToDownstream.has(upstreamId)) return null;
    const downstreamId = this.#upstreamToDownstream.get(upstreamId);
    this.#upstreamToDownstream.delete(upstreamId);
    this.#downstreamToUpstream.delete(downstreamId);
    for (const [upstreamToken, entry] of this.#progress) {
      if (entry.downstreamId === downstreamId) this.#progress.delete(upstreamToken);
    }
    return downstreamId;
  }

  mapCancellation(downstreamId) {
    this.#assertOpen();
    return this.#downstreamToUpstream.get(downstreamId) ?? null;
  }

  mapProgress(downstreamId, downstreamToken) {
    this.#assertOpen();
    if (!this.#downstreamToUpstream.has(downstreamId)) throw new Error("request id is not active");
    if (typeof downstreamToken !== "string" && typeof downstreamToken !== "number") throw new TypeError("invalid progress token");
    const upstreamToken = `${this.sessionId}:progress:${this.#nextId++}`;
    this.#progress.set(upstreamToken, { downstreamId, downstreamToken });
    return upstreamToken;
  }

  resolveProgress(upstreamToken) {
    this.#assertOpen();
    const entry = this.#progress.get(upstreamToken);
    return entry ? { ...entry } : null;
  }

  close() {
    this.#closed = true;
    this.#downstreamToUpstream.clear();
    this.#upstreamToDownstream.clear();
    this.#progress.clear();
  }

  #assertOpen() { if (this.#closed) throw new Error("session is closed"); }
  #assertId(value) {
    if (typeof value !== "string" && typeof value !== "number") throw new TypeError("request id must be a string or number");
  }
}
