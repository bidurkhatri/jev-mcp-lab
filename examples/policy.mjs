import { compilePolicy, evaluate } from "../src/policy.js";

const policy = compilePolicy({
  version: 1,
  rules: [
    {
      id: "deny-shell",
      effect: "deny",
      match: { method: "tools/call", tool: "shell" },
      reason: "shell is outside this integration's scope"
    },
    {
      id: "allow-read",
      effect: "allow",
      match: { method: "tools/call", tool: "files.read" }
    }
  ]
});

console.log(evaluate(policy, { method: "tools/call", tool: "files.read" }));
console.log(evaluate(policy, { method: "tools/call", tool: "shell" }));
