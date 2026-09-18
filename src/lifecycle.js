const STATES = new Set(["new", "initializing", "ready", "closing", "closed"]);

export class Lifecycle {
  #state = "new";
  #protocolVersion = null;
  #capabilities = null;

  beginInitialize(request) {
    this.#require("new");
    if (!request || request.method !== "initialize" || typeof request.params?.protocolVersion !== "string") {
      throw new TypeError("valid initialize request required");
    }
    this.#state = "initializing";
    return request.params.protocolVersion;
  }

  acceptInitialize(result, supportedVersions) {
    this.#require("initializing");
    if (!result || typeof result.protocolVersion !== "string" || !Array.isArray(supportedVersions)) {
      throw new TypeError("valid initialize result and supportedVersions required");
    }
    if (!supportedVersions.includes(result.protocolVersion)) {
      this.#state = "closed";
      throw new Error(`unsupported negotiated protocol version: ${result.protocolVersion}`);
    }
    this.#protocolVersion = result.protocolVersion;
    this.#capabilities = structuredClone(result.capabilities ?? {});
    return this.#protocolVersion;
  }

  initialized() {
    this.#require("initializing");
    if (this.#protocolVersion === null) throw new Error("initialize response not accepted");
    this.#state = "ready";
  }

  assertTrafficAllowed(message) {
    if (this.#state === "ready") return true;
    if (this.#state === "initializing" && message?.method === "notifications/initialized") return true;
    throw new Error(`traffic is not allowed while lifecycle is ${this.#state}`);
  }

  close() {
    if (this.#state === "closed") return false;
    if (!STATES.has(this.#state)) throw new Error("invalid lifecycle state");
    this.#state = "closing";
    this.#state = "closed";
    return true;
  }

  snapshot() {
    return Object.freeze({ state: this.#state, protocolVersion: this.#protocolVersion, capabilities: structuredClone(this.#capabilities) });
  }

  #require(expected) {
    if (this.#state !== expected) throw new Error(`expected lifecycle ${expected}, got ${this.#state}`);
  }
}
