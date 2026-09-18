# Architecture constraints

## Security boundary

Deterministic authorization decides allow or deny. A model or other advisory provider may produce labels, scores or audit context, but advisory output cannot override a deterministic deny or manufacture an allow.

## Fail-closed rules

- No matching allow rule means deny.
- Invalid policy means startup failure.
- Explicit deny takes priority over every allow.
- Advisory errors preserve the deterministic result.
- Unsupported MCP methods or content types are rejected rather than silently dropped.

## Modules

- `policy` and `load-policy`: deterministic policy compilation, evaluation and strict loading.
- `advisory`: timeout-bounded advisory queries whose result cannot change deterministic authorization.
- `audit`, `redact` and `audit-store`: credential redaction, hash chaining and bounded JSONL persistence.
- `protocol`, `support`, `content` and `limits`: envelope, method, content and resource-limit checks.
- `correlation`, `lifecycle`, `capabilities` and `duplex`: in-memory state and forwarding primitives.
- `http-session`: bounded request, Origin, version and session validation primitives, not a network server.

## Integration boundary

The repository does not implement a production proxy. A real adapter must define and test its exact methods, transport, identity, authentication, session, consent, retention and failure behavior. Passing these unit and fixture tests does not supply those controls.
