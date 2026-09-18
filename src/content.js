const TYPES = new Set(["text", "image", "audio", "resource", "resource_link"]);
export function validateContentBlock(block) {
  if (!block || typeof block !== "object" || Array.isArray(block)) throw new TypeError("content block must be an object");
  if (!TYPES.has(block.type)) throw new TypeError(`unsupported content type: ${block.type}`);
  if (block.type === "text" && typeof block.text !== "string") throw new TypeError("text content needs text");
  if ((block.type === "image" || block.type === "audio") && (typeof block.data !== "string" || typeof block.mimeType !== "string")) {
    throw new TypeError(`${block.type} content needs base64 data and mimeType`);
  }
  if (block.type === "resource" && (!block.resource || typeof block.resource.uri !== "string")) throw new TypeError("resource content needs a URI");
  if (block.type === "resource_link" && typeof block.uri !== "string") throw new TypeError("resource_link needs a URI");
  return Object.freeze({ ...block });
}
