import { readFile } from "node:fs/promises";
import { compilePolicy } from "./policy.js";

export async function loadPolicy(path) {
  let source;
  try {
    source = await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read policy: ${error.message}`, { cause: error });
  }
  let document;
  try {
    document = JSON.parse(source);
  } catch (error) {
    throw new Error(`invalid policy JSON: ${error.message}`, { cause: error });
  }
  return compilePolicy(document);
}
