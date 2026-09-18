const EFFECTS = new Set(["allow", "deny"]);

export function compilePolicy(document) {
  if (!document || document.version !== 1 || !Array.isArray(document.rules)) {
    throw new TypeError("policy must have version 1 and a rules array");
  }
  const ids = new Set();
  const rules = document.rules.map((rule, index) => {
    if (!rule || typeof rule.id !== "string" || !rule.id) {
      throw new TypeError(`rule ${index} needs a non-empty id`);
    }
    if (ids.has(rule.id)) throw new TypeError(`duplicate rule id: ${rule.id}`);
    ids.add(rule.id);
    if (!EFFECTS.has(rule.effect)) throw new TypeError(`invalid effect for ${rule.id}`);
    if (!rule.match || typeof rule.match !== "object") {
      throw new TypeError(`rule ${rule.id} needs a match object`);
    }
    return Object.freeze({
      id: rule.id,
      effect: rule.effect,
      reason: rule.reason ?? rule.id,
      match: Object.freeze({ ...rule.match })
    });
  });
  return Object.freeze({ version: 1, rules: Object.freeze(rules) });
}

function matches(match, request) {
  return Object.entries(match).every(([key, expected]) => {
    const actual = request[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    return expected === "*" || Object.is(expected, actual);
  });
}

export function evaluate(policy, request) {
  for (const rule of policy.rules) {
    if (rule.effect === "deny" && matches(rule.match, request)) {
      return { decision: "deny", ruleId: rule.id, reason: rule.reason };
    }
  }
  for (const rule of policy.rules) {
    if (rule.effect === "allow" && matches(rule.match, request)) {
      return { decision: "allow", ruleId: rule.id, reason: rule.reason };
    }
  }
  return { decision: "deny", ruleId: null, reason: "no allow rule matched" };
}

export function gate(policy, request, advisory = null) {
  const authorization = evaluate(policy, request);
  return {
    decision: authorization.decision,
    authorization,
    advisory,
    advisoryInfluencedDecision: false
  };
}
