# Public candidate decision

## Recommended name

**MCP Policy Fixtures** (`mcp-policy-fixtures`).

The name describes the two strongest tested parts without claiming a proxy, gateway, certification or complete security product. Point-in-time checks on 2026-09-19 found no exact public GitHub repository or npm package with this name. Availability is not a trademark clearance and must be rechecked before publication.

Rejected working names:

- `mcp-policy-lab`: an exact public GitHub repository already exists, and "lab" understates a reusable package.
- `mcp-policy-kit`: exact public GitHub repositories already exist.
- `mcp-guardrails`: crowded and more likely to imply broad protection than the evidence supports.
- `mcp-safety-kit`: no exact collision was found, but "safety" is broader than the tested policy and fixture surface.

## License

The owner approved **Apache License 2.0** for this candidate. It is permissive and includes an express patent grant and patent-termination terms, which fit a reusable protocol-testing library. `LICENSE`, `NOTICE`, and `package.json` record the choice. The package remains `private: true` until the owner separately approves the public state.

Primary references:

- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0.txt
- MIT License: https://opensource.org/license/mit
- npm package license field: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#license

This is a project-fit recommendation, not legal advice.

## Included files

- `.github/workflows/ci.yml`
- `.gitignore`
- `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE`
- `package.json`, `package-lock.json`
- generic implementation modules under `src/`
- generic fixture schema and nine fixture cases under `fixtures/`
- fixture validation, replay and candidate checks under `scripts/`
- generic unit and replay tests under `test/`
- architecture, audit, conformance, HTTP, threat-model, release-checklist and candidate-decision documents under `docs/`

## Explicit exclusions

- every `patches/` file
- upstream analyzers and patch verifiers
- upstream comparison and contribution-fit tests
- private research documents and pinned-upstream run records
- third-party API integration
- third-party project names, source comparisons, evaluation results and benchmark claims
- private release history from the lab branch

The `public-candidate` branch is a new single-commit history so excluded lab material is not recoverable from that branch's ancestors. The source repository must remain private until the owner reviews and approves the exact candidate commit.
