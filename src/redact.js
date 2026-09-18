const DEFAULT_KEYS = /^(authorization|cookie|set-cookie|api[-_]?key|token|secret|password|credential)$/i;

export function redact(value, options = {}) {
  const keyPattern = options.keyPattern ?? DEFAULT_KEYS;
  const maxDepth = options.maxDepth ?? 12;
  const seen = new WeakSet();
  function walk(input, depth) {
    if (depth > maxDepth) return "[REDACTED:DEPTH]";
    if (input === null || typeof input !== "object") return input;
    if (seen.has(input)) return "[REDACTED:CIRCULAR]";
    seen.add(input);
    if (Array.isArray(input)) return input.map((item) => walk(item, depth + 1));
    const output = {};
    for (const [key, item] of Object.entries(input)) {
      output[key] = keyPattern.test(key) ? "[REDACTED]" : walk(item, depth + 1);
    }
    return output;
  }
  return walk(value, 0);
}
