# Contributing

The project is still a private release candidate. Do not publish, mirror or announce it before the repository owner approves the final public state.

Changes should:

- add executable evidence for protocol or security claims
- keep deterministic authorization separate from advisory judgment
- include negative tests and reject unsupported cases explicitly
- avoid credentials, private traces, copied third-party material and benchmark claims
- update the conformance matrix when behavior changes

Run `npm run check`, `npm run fixtures:validate`, `npm run fixtures:replay` and `npm run release:check` before each commit.
