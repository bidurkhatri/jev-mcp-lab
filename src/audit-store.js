import { mkdir, open, readFile, rename, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { appendAudit, verifyAudit } from "./audit.js";

export class AuditStore {
  #path;
  #maxBytes;
  #tail = Promise.resolve();
  #previousHash = null;
  #sequence = 0;

  constructor(path, options = {}) {
    if (typeof path !== "string" || !path) throw new TypeError("audit path is required");
    this.#path = path;
    this.#maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
    if (!Number.isSafeInteger(this.#maxBytes) || this.#maxBytes < 1024) throw new TypeError("maxBytes must be an integer of at least 1024");
  }

  async recover() {
    await mkdir(dirname(this.#path), { recursive: true });
    let text = "";
    try { text = await readFile(this.#path, "utf8"); } catch (error) { if (error.code !== "ENOENT") throw error; }
    const lines = text.split("\n").filter(Boolean);
    const records = lines.map((line, index) => {
      try { return JSON.parse(line); } catch (error) { throw new Error(`invalid audit JSON at line ${index + 1}`, { cause: error }); }
    });
    if (!verifyAudit(records)) throw new Error("audit chain verification failed");
    this.#previousHash = records.at(-1)?.hash ?? null;
    this.#sequence = records.at(-1)?.sequence ?? records.length;
    return records.length;
  }

  append(event) {
    const operation = this.#tail.then(() => this.#append(event));
    this.#tail = operation.catch(() => {});
    return operation;
  }

  async rotate() {
    await this.#tail;
    let size = 0;
    try { size = (await stat(this.#path)).size; } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (size < this.#maxBytes) return null;
    const rotated = `${this.#path}.${Date.now()}.${this.#previousHash ?? "empty"}`;
    await rename(this.#path, rotated);
    this.#previousHash = null;
    this.#sequence = 0;
    return rotated;
  }

  async #append(event) {
    const sequence = this.#sequence + 1;
    const record = appendAudit(this.#previousHash, { sequence, ...event });
    const line = `${JSON.stringify({ sequence, ...record })}\n`;
    await mkdir(dirname(this.#path), { recursive: true });
    const file = await open(this.#path, "a", 0o600);
    try { await file.write(line); await file.sync(); } finally { await file.close(); }
    this.#previousHash = record.hash;
    this.#sequence = sequence;
    return record.hash;
  }
}
