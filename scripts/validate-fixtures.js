import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateFixture } from "../src/protocol.js";

const directory = new URL("../fixtures/cases/", import.meta.url);
const files = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
if (files.length === 0) throw new Error("no fixtures found");
for (const file of files) {
  const body = JSON.parse(await readFile(join(directory.pathname, file), "utf8"));
  validateFixture(body);
  process.stdout.write(`ok ${file}\n`);
}
process.stdout.write(`${files.length} fixture(s) valid\n`);
