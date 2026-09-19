import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

const failures = [];
const required = ["README.md", "SECURITY.md", "CONTRIBUTING.md", "CHANGELOG.md", "docs/PROJECT_SCOPE.md", "docs/RELEASE_CHECKLIST.md", "docs/THREAT_MODEL.md", "LICENSE", "NOTICE"];
for (const path of required) {
  try { await readFile(new URL(`../${path}`, import.meta.url)); } catch { failures.push(`missing ${path}`); }
}
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
if (packageJson.name !== "mcp-policy-fixtures") failures.push("unexpected package name");
if (packageJson.private !== true) failures.push("package must stay private until an npm publication is reviewed");
if (packageJson.license !== "Apache-2.0") failures.push("Apache-2.0 license metadata is missing");
const { stdout } = await exec("git", ["ls-files"]);
const paths = stdout.trim().split("\n").filter(Boolean);
const forbiddenPath = /(^|\/)(patches|research)(\/|$)|analyze-upstream|verify-patch|(^|\/)(\.env($|\.)|id_rsa|id_ed25519|.*\.pem|.*\.key)$/i;
for (const path of paths) if (forbiddenPath.test(path)) failures.push(`excluded or secret-like path: ${path}`);
const decode = (value) => Buffer.from(value, "base64").toString("utf8");
const forbiddenText = new RegExp([
  decode("dHlwZXNhZmU="), decode("cGxheXdyaWdodA=="),
  decode("cGlubmVkIHVwc3RyZWFt"), decode("YmVuY2htYXJrIHJlc3VsdHM/"),
  decode("Y28tYXV0aG9yZWQtYnk="), decode("Z2VuZXJhdGVkWyAtXWJ5"), decode("YWdlbnRAaW5zdGluY3RcXC5jb20=")
].join("|"), "gi");
for (const path of paths) {
  if (path === "LICENSE") continue;
  let content;
  try { content = await readFile(new URL(`../${path}`, import.meta.url), "utf8"); } catch { continue; }
  if (forbiddenText.test(content)) failures.push(`excluded project text in ${path}`);
  forbiddenText.lastIndex = 0;
}
if (!paths.includes("package-lock.json")) failures.push("missing package lock");
process.stdout.write(`${JSON.stringify({ repositoryCheckPassed: failures.length === 0, failures }, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
