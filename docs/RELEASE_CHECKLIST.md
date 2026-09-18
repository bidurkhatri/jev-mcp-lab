# Release checklist

## Automated candidate checks

```sh
npm ci
npm run check
npm run fixtures:validate
npm run fixtures:replay
npm audit
npm run release:check
npm pack --dry-run
```

## Owner gates

- [x] Select the generic standalone project shape.
- [ ] Approve the exact public name: MCP Policy Fixtures / `mcp-policy-fixtures`.
- [x] Approve and apply Apache License 2.0.
- [ ] Review the exact candidate commit, included file manifest and README claims.
- [ ] Recheck package, repository and trademark/name availability.
- [ ] Approve changing visibility or creating a new public repository from the candidate history.
- [ ] Separately approve any package publication, GitHub release, registry submission or announcement.

A visibility change does not authorize package publication or outreach.
