# Project scope

## Name and purpose

**MCP Policy Fixtures** is the project title. The package identifier is `mcp-policy-fixtures`; the GitHub repository remains `jev-mcp-lab` by the owner's choice.

The project provides small, dependency-free JavaScript building blocks for deterministic MCP policy checks, protocol fixtures, in-memory replay, and audit evidence. The name describes the two strongest tested parts without claiming a proxy, gateway, certification, or complete security product.

## License

The project uses the **Apache License 2.0**. `LICENSE`, `NOTICE`, and `package.json` record the terms and attribution.

Primary reference: https://www.apache.org/licenses/LICENSE-2.0.txt

## Repository contents

- `.github/workflows/ci.yml`
- `.gitignore`
- `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, and `NOTICE`
- generic implementation modules under `src/`
- fixture schema and nine fixture cases under `fixtures/`
- runnable policy and advisory examples under `examples/`
- fixture validation, replay, repository checks, and package checks under `scripts/`
- unit and replay tests under `test/`
- architecture, audit, conformance, HTTP, threat-model, and maintenance documents under `docs/`

## Deliberate exclusions

- third-party model API integrations
- vendor-specific evaluation results or performance comparisons
- upstream patches and private research records
- production transport, authentication, authorization, user-consent, sandboxing, or key-management implementations
- claims of protocol certification, tool safety, or a universal MCP gateway

These boundaries keep the public project focused on behavior supported by executable tests.
