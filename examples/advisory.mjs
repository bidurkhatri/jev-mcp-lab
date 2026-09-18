import { decideWithAdvisory } from "../src/advisory.js";
import { compilePolicy } from "../src/policy.js";

const policy = compilePolicy({ version: 1, rules: [] });
const result = await decideWithAdvisory(
  policy,
  { method: "tools/call", tool: "shell" },
  async () => ({ label: "allow", confidence: 1 })
);

console.log({
  decision: result.decision,
  advisory: result.advisory,
  advisoryInfluencedDecision: result.advisoryInfluencedDecision
});
