const METHOD_CAPABILITY = Object.freeze({
  "tools/list": ["tools"], "tools/call": ["tools"],
  "prompts/list": ["prompts"], "prompts/get": ["prompts"],
  "resources/list": ["resources"], "resources/read": ["resources"], "resources/templates/list": ["resources"],
  "completion/complete": ["completions"], "logging/setLevel": ["logging"],
  "sampling/createMessage": ["sampling"], "elicitation/create": ["elicitation"], "roots/list": ["roots"]
});

export function capabilityDecision(method, capabilities) {
  const path = METHOD_CAPABILITY[method];
  if (!path) return { allowed: true, reason: "method has no capability gate" };
  let value = capabilities;
  for (const part of path) value = value?.[part];
  return value === undefined
    ? { allowed: false, reason: `method ${method} was not negotiated` }
    : { allowed: true, reason: "capability negotiated" };
}
