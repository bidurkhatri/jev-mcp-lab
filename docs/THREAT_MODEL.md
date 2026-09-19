# Threat model

## Assets

- user authorization and policy intent
- MCP request, response and notification integrity
- credentials, session IDs and private content
- audit integrity and availability
- client and server process availability

## Trust boundaries

1. The client and its user-facing approval flow.
2. The deterministic policy engine.
3. The advisory provider, which is untrusted for authorization.
4. The downstream MCP server and its tools.
5. Transport and session metadata.
6. Audit storage and operators.

## Adversaries and failures

- prompt or state content that argues for its own approval
- a compromised or malicious downstream server
- malformed JSON-RPC envelopes and unsupported MCP methods
- request ID, progress token, cancellation or session confusion
- credential-bearing tool arguments, headers and audit fields
- advisory timeout, outage, malformed answer or adversarial score
- policy omission, corruption, ambiguity or unsafe broad rule
- replay, resource exhaustion and oversized content
- dependency or release artifact compromise

## Controls in this project

- default deny, explicit allow and deny precedence
- advisory isolation: provider success, failure and timeout cannot change authorization
- envelope validation and explicit rejection of unsupported protocol traffic
- opaque identifier mapping scoped to a connection and session
- credential redaction before persistence and hashing
- bounded payload size, structure and concurrency
- hash-chained JSONL audit records with recovery and size-based rotation
- least-privilege CI without release credentials
- executable fixtures for every behavior claimed in the conformance matrix

## Non-guarantees

This code does not prove that a tool is safe, contain a compromised client or server, make an advisory provider resistant to adversarial state, replace user permission or make a generic MCP proxy transparent. It does not supply transport authentication, process isolation, key custody, data-retention policy or incident response.

## Open production work

- exact adapter and connection model
- transport authentication and authorization
- Streamable HTTP framing, resume, expiration and distributed session state
- signed audit segments, cross-process writer coordination, partial-line recovery, retention and encryption
- deployment-specific quotas, sandboxing and abuse-case review
