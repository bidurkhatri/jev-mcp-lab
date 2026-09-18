# Streamable HTTP constraints

Source baseline: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports

This repository does not yet implement a network listener. The tested primitives in `http-session.js` capture security-sensitive constraints needed before one exists:

- session IDs are opaque and must be present after establishment
- unknown or closed sessions are rejected
- `Last-Event-ID` resume state remains distinct from the server's latest event
- Origin is normalized and checked against an exact allowlist
- responses negotiate JSON or `text/event-stream`
- POST, GET and DELETE are the only accepted methods
- POST requires JSON content and GET requires event-stream
- protocol-version headers are required and checked against an allowlist

A later adapter must also handle authentication, SSE event framing, reconnection, concurrent streams, session expiration, replay storage and authorization checks. These primitives do not claim full Streamable HTTP support.
