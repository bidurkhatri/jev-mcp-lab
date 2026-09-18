export const DEFAULT_LIMITS = Object.freeze({
  maxMessageBytes: 1024 * 1024,
  maxDepth: 64,
  maxObjectKeys: 10_000,
  maxArrayItems: 10_000
});

export function measureUtf8(value) {
  try {
    return Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value), "utf8");
  } catch (error) {
    if (error instanceof TypeError) throw new TypeError("message contains a cycle", { cause: error });
    throw error;
  }
}

export function enforceLimits(value, limits = DEFAULT_LIMITS) {
  const options = { ...DEFAULT_LIMITS, ...limits };
  const bytes = measureUtf8(value);
  if (bytes > options.maxMessageBytes) throw new RangeError("message exceeds byte limit");
  const stack = [{ value, depth: 0 }];
  const seen = new WeakSet();
  while (stack.length) {
    const current = stack.pop();
    const item = current.value;
    if (item === null || typeof item !== "object") continue;
    if (seen.has(item)) throw new TypeError("message contains a cycle");
    seen.add(item);
    if (current.depth > options.maxDepth) throw new RangeError("message exceeds depth limit");
    if (Array.isArray(item)) {
      if (item.length > options.maxArrayItems) throw new RangeError("array exceeds item limit");
      for (const child of item) stack.push({ value: child, depth: current.depth + 1 });
    } else {
      const entries = Object.entries(item);
      if (entries.length > options.maxObjectKeys) throw new RangeError("object exceeds key limit");
      for (const [, child] of entries) stack.push({ value: child, depth: current.depth + 1 });
    }
  }
  return Object.freeze({ bytes });
}

export class ConcurrencyGate {
  #active = 0;
  constructor(maxConcurrent = 32) {
    if (!Number.isSafeInteger(maxConcurrent) || maxConcurrent < 1) throw new TypeError("maxConcurrent must be a positive integer");
    this.maxConcurrent = maxConcurrent;
  }
  enter() {
    if (this.#active >= this.maxConcurrent) throw new RangeError("concurrency limit reached");
    this.#active += 1;
    let released = false;
    return () => {
      if (released) return false;
      released = true;
      this.#active -= 1;
      return true;
    };
  }
  get active() { return this.#active; }
}
