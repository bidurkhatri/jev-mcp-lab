# MCP Policy Fixtures

Small, dependency-free building blocks for testing policy and protocol behavior around Model Context Protocol (MCP) integrations.

MCP connects clients to tools and data. That connection creates two separate problems: deciding which calls are allowed, and preserving protocol state while messages move between links. This project makes both problems explicit and testable. It provides a deterministic policy core, checked protocol fixtures, an in-memory duplex harness, bounded validation helpers, and tamper-evident audit primitives.

The project is public source code under Apache-2.0. It supplies tested primitives, not a complete production security boundary.

## Who this is for

Use the project if you are building or reviewing an MCP client, server, proxy, policy layer, test harness, or security control and need executable examples for:

- default-deny tool policy;
- request, response, progress, and cancellation correlation;
- method, capability, lifecycle, content, and size checks;
- record/replay fixtures with expected forwarding outcomes;
- redacted, hash-chained audit records.

## What it does

| Area | Tested behavior |
| --- | --- |
| Policy | strict loading, default deny, explicit deny precedence, machine-readable decisions |
| Advisory isolation | an optional async provider receives a cloned request; its value, error, or timeout cannot change authorization |
| Protocol | JSON-RPC envelope classification and explicit directional MCP method checks |
| State | session-scoped request IDs, progress tokens, cancellation IDs, lifecycle, and capabilities |
| Limits | UTF-8 bytes, object depth, key count, array items, cycles, and concurrent forwarding |
| Content | text, image, audio, resource links, embedded resources, and structured content |
| Streamable HTTP helpers | methods, content type, `Accept`, `Origin`, protocol version, opaque sessions, close, and resume-cursor state |
| Audit | credential redaction, stable hash chaining, sync-to-disk JSONL append, recovery, tamper detection, and size-based rotation |
| Fixtures | nine checked-in cases that validate and replay through the in-memory duplex harness |

## What it does not do

- It does not run an MCP server or proxy.
- It does not provide transport authentication, user identity, consent, sandboxing, or secret storage.
- It does not decide whether a tool is safe. Policy only evaluates the fields and rules you provide.
- It does not claim complete MCP conformance or certification.
- It does not make model output an authorization signal.
- It does not include third-party model APIs, model evaluations, or performance comparisons.

## Five-minute start

Requirements: Node.js 20 or 22 and npm.

```sh
git clone https://github.com/bidurkhatri/jev-mcp-lab.git
cd jev-mcp-lab
npm ci
npm run check
npm run fixtures:validate
npm run fixtures:replay
```


Run the examples from the repository root:

```sh
node examples/policy.mjs
node examples/advisory.mjs
```

### Deterministic policy

```js
import { compilePolicy, evaluate } from "./src/policy.js";

const policy = compilePolicy({
  version: 1,
  rules: [
    {
      id: "deny-shell",
      effect: "deny",
      match: { method: "tools/call", tool: "shell" },
      reason: "shell is outside this integration's scope"
    },
    {
      id: "allow-read",
      effect: "allow",
      match: { method: "tools/call", tool: "files.read" }
    }
  ]
});

console.log(evaluate(policy, { method: "tools/call", tool: "files.read" }));
// { decision: "allow", ruleId: "allow-read", reason: "allow-read" }

console.log(evaluate(policy, { method: "tools/call", tool: "shell" }));
// { decision: "deny", ruleId: "deny-shell", reason: "shell is outside this integration's scope" }
```

When installed as a package later, import from `mcp-policy-fixtures/policy` instead of the local path.

### Optional advisory data cannot authorize

```js
import { decideWithAdvisory } from "./src/advisory.js";
import { compilePolicy } from "./src/policy.js";

const policy = compilePolicy({ version: 1, rules: [] });
const result = await decideWithAdvisory(
  policy,
  { method: "tools/call", tool: "shell" },
  async () => ({ label: "allow", confidence: 1 })
);

console.log(result.decision);                   // "deny"
console.log(result.advisory);                   // recorded for the application
console.log(result.advisoryInfluencedDecision); // false
```

The provider receives a structured clone of the request and an `AbortSignal`. The default timeout is 250 ms. Providers should stop work when the signal is aborted; the wrapper can return after the timeout, but it cannot forcibly terminate arbitrary provider code.

## Policy semantics

A policy document has `version: 1` and an ordered array of rules. Every rule needs a unique `id`, an `effect` of `allow` or `deny`, and a `match` object.

Matching is deliberately small:

- each key in `match` is compared with the same top-level request key;
- a scalar uses exact `Object.is` equality;
- an array matches when it includes the request value;
- `"*"` matches any value;
- a missing match means the rule does not apply.

Evaluation is not first-match-wins. All matching deny rules are checked before matching allow rules. If no allow rule matches, the result is deny. Nested argument policy, path patterns, identities, roles, and consent are application concerns unless you normalize them into explicit top-level request fields.

`loadPolicy(path)` parses and compiles JSON. A missing file, invalid JSON, unsupported version, duplicate rule ID, invalid effect, or missing match object rejects startup instead of creating a permissive fallback.

## Architecture

```text
MCP message
    |
    v
limits -> envelope/method/content checks -> lifecycle/capability checks
    |                                          |
    | tools/call                               | supported traffic
    v                                          v
deterministic policy ----------------> session-scoped correlation
    |                                          |
    | allow                                    v
    +----------------------------------> forwarded clone / replay event
    |
    +--> optional advisory value and redacted audit context
         (never changes allow or deny)
```

The modules are independent:

- `policy` and `load-policy` compile and evaluate deterministic rules;
- `advisory` bounds optional asynchronous context without changing policy;
- `protocol`, `support`, `content`, and `limits` reject malformed or unsupported input;
- `correlation`, `lifecycle`, `capabilities`, and `duplex` model state between two in-memory links;
- `audit`, `redact`, and `audit-store` create and persist redacted hash chains;
- `http-session` contains request/session checks, not a network listener.

See [architecture constraints](docs/ARCHITECTURE.md) and the [threat model](docs/THREAT_MODEL.md).

## Fixtures and replay

Each JSON file in `fixtures/cases/` records:

- a fixture ID and purpose;
- message direction;
- one JSON-RPC message;
- the expected forwarding result;
- the policy decision when the case crosses a tool-call boundary.

Validate schema and metadata:

```sh
npm run fixtures:validate
```

Replay every case through the in-memory duplex harness:

```sh
npm run fixtures:replay
```

Current evidence is nine fixtures validated and nine replayed with matching outcomes. Replay seeds only the correlation state needed by standalone progress, cancellation, and response examples. It is protocol test evidence, not a live transport test.

## Supported MCP surface

The project has tested primitives for selected lifecycle, tools, resources, prompts, logging, progress, cancellation, sampling, elicitation, roots, capabilities, content, and Streamable HTTP constraints. Some areas have only an envelope fixture or mapping primitive. None is claimed as a complete adapter.

Read [the conformance matrix](docs/CONFORMANCE.md) for the exact evidence and gaps. The matrix is the claim boundary. A future adapter must add end-to-end framing, authentication, authorization, reconnect, expiration, and application behavior tests before it can claim transport support.

## Security and trust model

Deterministic policy is the only authorization input in this library. Advisory output is untrusted context. Explicit deny takes priority, invalid policy fails closed, unsupported protocol traffic fails explicitly, and credentials are redacted before audit hashing or persistence.

These controls do not replace:

- authenticated user and client identity;
- confirmation and consent for side effects;
- OS/container isolation;
- downstream tool permissions;
- encryption, retention, and key management;
- monitoring and incident response.

Audit files use mode `0600`, serialize appends within one process, sync each record, verify the active chain during recovery, and rotate at a byte threshold. They do not yet have signed segment manifests, cross-process writer locks, partial-final-line recovery, retention deletion, encryption at rest, or remote collection. See [audit storage limits](docs/AUDIT_STORAGE.md).

## Evidence

Current repository evidence:

- 73 repository tests pass on the local release check;
- nine fixtures validate and replay with expected outcomes;
- CI runs the same checks on Node.js 20 and 22;
- `npm audit` reports no known dependencies or vulnerabilities;
- the package dry run contains only the declared runtime files;
- the repository check rejects excluded research, patch, credential-like, and non-owner attribution material.

Numbers describe the current main commit, not future versions. Re-run the commands below rather than copying the counts into another release.

```sh
npm ci
npm run check
npm run fixtures:validate
npm run fixtures:replay
npm audit --audit-level=low
npm run repo:check
npm run package:check
```

## Limitations and roadmap

Before a production adapter exists:

1. choose one exact transport and identity model;
2. add end-to-end stdio or Streamable HTTP tests;
3. define authentication, authorization, consent, and session-expiry behavior;
4. add cross-process and crash-safe audit storage or integrate an established store;
5. test resource exhaustion and downstream failure behavior in the deployment environment;
6. publish only claims linked to executable evidence in the conformance matrix.

The project will stay a library and fixture corpus unless a later adapter has a bounded protocol surface and its own threat model. A universal or transparent MCP gateway is not on the roadmap.

## Contributing

Changes should include positive and negative tests, update the conformance matrix when behavior changes, and avoid claims broader than the test surface. Run the full evidence command block before proposing a change. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project and package state

The project name is **MCP Policy Fixtures**. The GitHub repository is `jev-mcp-lab`, and the reserved package identifier is `mcp-policy-fixtures`. `package.json` stays `private: true` because no npm package is published. The source repository is public under Apache-2.0.

See [project scope](docs/PROJECT_SCOPE.md) and the [maintenance checklist](docs/RELEASE_CHECKLIST.md).
