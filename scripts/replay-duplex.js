import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createDuplexHarness } from "../src/duplex.js";

const directory = new URL("../fixtures/cases/", import.meta.url);
const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
const results = [];
for (const file of files) {
  const fixture = JSON.parse(await readFile(join(directory.pathname, file), "utf8"));
  const authorize = () => ({ decision: fixture.expected.decision === "deny" ? "deny" : "allow", reason: fixture.expected.reason });
  const harness = createDuplexHarness({ sessionId: file, authorize });
  let message = structuredClone(fixture.message);
  if (message.method === "notifications/cancelled") {
    const request = harness.forward("client-to-server", { jsonrpc: "2.0", id: message.params.requestId, method: "tools/list" });
    if (!request.forwarded) throw new Error("failed to seed cancellation request");
  } else if (message.method === "notifications/progress") {
    const request = harness.forward("client-to-server", { jsonrpc: "2.0", id: "seed", method: "tools/call", params: { name: "read", _meta: { progressToken: message.params.progressToken } } });
    if (!request.forwarded) throw new Error("failed to seed progress request");
    message.params.progressToken = request.message.params._meta.progressToken;
  } else if (!message.method && Object.hasOwn(message, "id")) {
    const request = harness.forward("client-to-server", { jsonrpc: "2.0", id: message.id, method: "tools/list" });
    if (!request.forwarded) throw new Error("failed to seed response request");
    message.id = request.message.id;
  }
  let outcome;
  try { outcome = harness.forward(fixture.direction, message); }
  catch (error) { outcome = { forwarded: false, error: { message: error.message } }; }
  const expectedForward = fixture.expected.forward;
  results.push({ file, expectedForward, actualForward: outcome.forwarded, matches: expectedForward === outcome.forwarded, error: outcome.error?.message ?? null });
  harness.close();
}
const failed = results.filter((result) => !result.matches);
process.stdout.write(`${JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
