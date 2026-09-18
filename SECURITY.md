# Security policy

## Design boundary

Deterministic policy decides allow or deny. Advisory output may be recorded, but cannot grant permission, override a deny or create an allow rule. Missing or invalid policy fails closed.

This library is not a security boundary by itself. Integrators remain responsible for identity, authorization, user consent, transport security, sandboxing, credential custody, retention and incident response.

## Reporting a vulnerability

Before a public contact route is approved, use the repository owner's existing private contact channel. Do not include credentials, private MCP payloads, access tokens or personal data in a report.

## Known limits

- no production transport adapter or authentication layer
- no signed audit-segment manifest or cross-process writer lock
- no partial-final-line recovery, retention deletion, encryption-at-rest or remote audit collection
- no proof of complete MCP method or transport coverage
- no guarantee that an allowed tool or downstream server is safe

These limits must remain visible in every release.
