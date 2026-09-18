export class AdvisoryTimeoutError extends Error {
  constructor(message = "advisory provider timed out") { super(message); this.name = "AdvisoryTimeoutError"; }
}

export async function queryAdvisory(provider, input, options = {}) {
  if (typeof provider !== "function") return { status: "disabled", value: null };
  const timeoutMs = options.timeoutMs ?? 250;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError("timeoutMs must be a positive integer");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const value = await provider(structuredClone(input), { signal: controller.signal });
    return { status: "ok", value };
  } catch (error) {
    if (controller.signal.aborted) return { status: "error", value: null, error: new AdvisoryTimeoutError() };
    return { status: "error", value: null, error };
  } finally {
    clearTimeout(timeout);
  }
}

export async function decideWithAdvisory(policy, request, provider, options = {}) {
  const { evaluate } = await import("./policy.js");
  const authorization = evaluate(policy, request);
  const advisory = await queryAdvisory(provider, request, options);
  return {
    decision: authorization.decision,
    authorization,
    advisory: advisory.status === "ok" ? advisory.value : null,
    advisoryStatus: advisory.status,
    advisoryError: advisory.status === "error" ? advisory.error?.name ?? "Error" : null,
    advisoryInfluencedDecision: false
  };
}
