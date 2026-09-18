import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AuditStore } from "../src/audit-store.js";

test("persists, recovers and continues a verified chain", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audit-store-")); const path = join(dir, "audit.jsonl");
  const first = new AuditStore(path); assert.equal(await first.recover(), 0);
  await first.append({ decision: "deny", token: "secret" });
  const second = new AuditStore(path); assert.equal(await second.recover(), 1);
  await second.append({ decision: "allow" });
  const lines = (await readFile(path, "utf8")).trim().split("\n").map(JSON.parse);
  assert.equal(lines.length, 2); assert.equal(lines[0].event.token, "[REDACTED]"); assert.equal(lines[1].previousHash, lines[0].hash);
});

test("serializes concurrent appends without breaking sequence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audit-store-")); const path = join(dir, "audit.jsonl");
  const store = new AuditStore(path); await store.recover();
  await Promise.all(Array.from({ length: 20 }, (_, value) => store.append({ value })));
  const lines = (await readFile(path, "utf8")).trim().split("\n").map(JSON.parse);
  assert.deepEqual(lines.map((line) => line.sequence), Array.from({ length: 20 }, (_, i) => i + 1));
  const recovered = new AuditStore(path); assert.equal(await recovered.recover(), 20);
});

test("detects persisted tampering during recovery", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audit-store-")); const path = join(dir, "audit.jsonl");
  const store = new AuditStore(path); await store.recover(); await store.append({ decision: "deny" });
  const text = (await readFile(path, "utf8")).replace('"deny"', '"allow"'); await writeFile(path, text);
  await assert.rejects(new AuditStore(path).recover(), /verification failed/);
});

test("rotates only after the size threshold", async () => {
  const dir = await mkdtemp(join(tmpdir(), "audit-store-")); const path = join(dir, "audit.jsonl");
  const store = new AuditStore(path, { maxBytes: 1024 }); await store.recover();
  for (let i = 0; i < 20; i++) await store.append({ data: "x".repeat(80), i });
  const rotated = await store.rotate(); assert.match(rotated, /audit\.jsonl\./);
  assert.equal(await store.recover(), 0);
});
