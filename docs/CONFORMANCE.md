# MCP conformance matrix

This matrix prevents "transparent proxy" or complete-conformance claims. "Tested primitive" means executable unit or in-memory replay evidence exists. It does not mean a deployed transport adapter supports the whole area.

| Area | Project evidence | Not established |
|---|---|---|
| JSON-RPC envelopes | request, response, error and notification classification; malformed envelope rejection | wire framing and transport delivery |
| initialization and lifecycle | ordered state transitions and negotiated version allowlist | a complete client/server handshake over a real transport |
| methods | explicit directional allowlists and unsupported-method errors | every MCP method or future protocol revision |
| tools and policy | default deny, explicit deny precedence, pre-forward policy gate | tool safety, identity, consent or sandboxing |
| content | text, image, audio, resource-link and embedded-resource validation | application-specific semantic safety |
| progress and cancellation | session-scoped token and request-ID mappings | downstream cancellation guarantees |
| sampling, elicitation and roots | checked fixture envelopes and capability gates | complete application implementations |
| capabilities | cloned negotiated capabilities and method gates | transport negotiation and extension compatibility |
| limits | bytes, depth, keys, array items, cycles and concurrency | process isolation and distributed quotas |
| Streamable HTTP | Origin, method, content-type, Accept, version and opaque-session checks | HTTP server, authentication, SSE reconnect, session expiry and distributed state |
| audit | redaction, hash chain, append sync, recovery, tamper detection and threshold rotation | signed segments, cross-process locking, retention, encryption and remote collection |

The checked fixtures are examples for the listed behaviors, not protocol certification. New claims need a linked positive test, negative test and, where applicable, end-to-end transport evidence.
