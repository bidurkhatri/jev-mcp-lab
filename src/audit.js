import { createHash } from "node:crypto";
import { redact } from "./redact.js";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function appendAudit(previousHash, event) {
  if (previousHash !== null && !/^[a-f0-9]{64}$/.test(previousHash)) {
    throw new TypeError("previousHash must be null or a SHA-256 hex digest");
  }
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("event must be an object");
  }
  const body = { previousHash, event: redact(event) };
  const hash = createHash("sha256").update(stable(body)).digest("hex");
  return Object.freeze({ ...body, hash });
}

export function verifyAudit(records) {
  let previousHash = null;
  for (const record of records) {
    const expected = appendAudit(previousHash, record.event);
    if (record.previousHash !== previousHash || record.hash !== expected.hash) return false;
    previousHash = record.hash;
  }
  return true;
}
