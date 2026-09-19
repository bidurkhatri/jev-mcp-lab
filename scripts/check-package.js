import { mkdtemp, readFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
const exec = promisify(execFile);
const expected = new Set([
  "README.md", "SECURITY.md", "LICENSE", "NOTICE", "package.json", "examples/advisory.mjs", "examples/policy.mjs",
  ...["advisory", "audit-store", "audit", "capabilities", "content", "correlation", "duplex", "http-session", "lifecycle", "limits", "load-policy", "policy", "protocol", "redact", "support"].map((name) => `src/${name}.js`),
  "fixtures/record-replay.schema.json",
  ...["cancelled.notification", "content.result", "elicitation.request", "initialize.request", "progress.notification", "roots.request", "sampling.request", "tools-call.deny", "unsupported.request"].map((name) => `fixtures/cases/${name}.json`)
]);
const dir = await mkdtemp(join(tmpdir(), "mcp-policy-fixtures-pack-"));
try {
  const { stdout } = await exec("npm", ["pack", "--dry-run", "--json"], { maxBuffer: 2_000_000 });
  const result = JSON.parse(stdout)[0];
  const paths = new Set(result.files.map((file) => file.path));
  const missing = [...expected].filter((path) => !paths.has(path));
  const extra = [...paths].filter((path) => !expected.has(path));
  if (missing.length || extra.length) throw new Error(`package manifest mismatch: missing=${missing.join(",")} extra=${extra.join(",")}`);
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  if (packageJson.private !== true || packageJson.license !== "Apache-2.0") throw new Error("package privacy or license metadata changed");
  process.stdout.write(`${JSON.stringify({ packageManifestPassed: true, fileCount: paths.size, packedBytes: result.size, unpackedBytes: result.unpackedSize }, null, 2)}\n`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
