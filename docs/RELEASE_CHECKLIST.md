# Maintenance checklist

Run these checks before merging a change or preparing a versioned artifact:

```sh
npm ci
npm run check
npm run fixtures:validate
npm run fixtures:replay
npm audit --audit-level=low
npm run repo:check
npm run package:check
```

Review the change for:

- [ ] claims that match executable evidence in `docs/CONFORMANCE.md`;
- [ ] positive and negative tests for changed behavior;
- [ ] no credentials, private traces, personal data, or copied third-party material;
- [ ] accurate package contents and metadata;
- [ ] updates to the threat model and limitations when trust boundaries change;
- [ ] a clean install on supported Node.js versions;
- [ ] a focused changelog entry when behavior changes.

Package publication, GitHub Releases, registry submissions, and announcements are separate operations and are not performed by the repository checks.
