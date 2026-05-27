# Changelog

## v0.1.0 — 2026-05-27

- Initial release: GitHub Action wrapping `kg-suite-fleet-overview` as a cross-protocol composition reporter + optional gate.
- Inputs: `dir` (required), `comment-on-pr` (auto/true/false), `fail-on-missing-protocol` (default false), `fail-on-unrouted` (default false), `max-unrouted` (optional), `github-token`.
- Outputs: `total-files`, `protocols-detected`, `missing-protocols`, `unrouted-files`.
- Vendored detect + overview + format from `kg-suite-fleet-overview`.
- Posts a one-page Markdown overview as a PR comment when run on `pull_request` events: composition table, per-protocol tables, low-confidence routings, unrouted documents.
- Three optional fail triggers: missing-core-protocol / fail-on-unrouted / max-unrouted threshold.
- Composite Node 20 action with `dist/index.js` committed for SHA/tag pinning.
- 15 tests, runner integration + vendored-library unit coverage.
- 9-document mixed-protocol fixture corpus (every Suite protocol + deliberate v0.1/v0.2 drift on agent-cards-spec).
- **Completes the cross-protocol governance Action quartet** with `kg-suite-spec-version-tracker-action`, `kg-suite-conformance-runner-action`, and `kg-suite-canonicalize-action`. Run all four as a 4-gate Suite CI.
- Node 20/22 CI (lint, typecheck, coverage, build, `npm audit`), AGPL-3.0-or-later, Dependabot.
