const SUPPORTED = Object.freeze({
  "client-to-server": new Set([
    "initialize", "ping", "tools/list", "tools/call", "prompts/list", "prompts/get",
    "resources/list", "resources/read", "resources/templates/list", "completion/complete", "logging/setLevel"
  ]),
  "server-to-client": new Set(["ping", "sampling/createMessage", "elicitation/create", "roots/list"])
});

const NOTIFICATIONS = Object.freeze({
  "client-to-server": new Set(["notifications/initialized", "notifications/cancelled", "notifications/progress"]),
  "server-to-client": new Set([
    "notifications/cancelled", "notifications/progress", "notifications/message",
    "notifications/tools/list_changed", "notifications/prompts/list_changed",
    "notifications/resources/list_changed", "notifications/resources/updated", "notifications/roots/list_changed"
  ])
});

export function supportDecision(direction, message) {
  if (!SUPPORTED[direction]) throw new TypeError("invalid direction");
  if (!message || typeof message.method !== "string") return { supported: true, reason: "response or error" };
  const methods = Object.hasOwn(message, "id") ? SUPPORTED[direction] : NOTIFICATIONS[direction];
  if (methods.has(message.method)) return { supported: true, reason: "explicitly listed" };
  return { supported: false, reason: `unsupported ${direction} method: ${message.method}` };
}
