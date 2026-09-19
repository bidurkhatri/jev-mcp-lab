# Contributing

Changes should:

- add executable evidence for protocol or security claims;
- keep deterministic authorization separate from advisory judgment;
- include negative tests and reject unsupported cases explicitly;
- avoid credentials, private traces, copied third-party material, and unverified performance claims;
- update the conformance matrix when behavior changes.

## Development workflow

```sh
npm ci
npm run check
npm run fixtures:validate
npm run fixtures:replay
npm audit --audit-level=low
npm run repo:check
npm run package:check
```

Keep changes small enough to review. Explain the behavior being changed, the failure mode it addresses, and the test that proves it. Do not broaden protocol or security claims without end-to-end evidence.
