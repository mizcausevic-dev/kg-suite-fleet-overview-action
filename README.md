# kg-suite-fleet-overview-action

[![CI](https://github.com/mizcausevic-dev/kg-suite-fleet-overview-action/actions/workflows/ci.yml/badge.svg)](https://github.com/mizcausevic-dev/kg-suite-fleet-overview-action/actions/workflows/ci.yml)
[![License: AGPL-3.0-or-later](https://img.shields.io/badge/License-AGPL--3.0--or--later-blue.svg)](LICENSE)

GitHub Action that walks a **mixed-protocol** directory of [Kinetic Gain Suite](https://suite.kineticgain.com/) JSON documents, routes each via `kg-protocol-detect`, groups by `(protocol, spec_version)`, and posts a **unified one-page composition overview** as a PR comment. Optionally fails the run when **core protocols are missing** from the fleet or **unrouted documents** exceed a threshold.

Wraps [`kg-suite-fleet-overview`](https://github.com/mizcausevic-dev/kg-suite-fleet-overview) — the composition capstone.

**Completes the cross-protocol governance Action quartet** alongside:

- [`kg-suite-spec-version-tracker-action`](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) — version drift
- [`kg-suite-conformance-runner-action`](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action) — required-block structural validation
- [`kg-suite-canonicalize-action`](https://github.com/mizcausevic-dev/kg-suite-canonicalize-action) — silent-edit hash drift
- **`kg-suite-fleet-overview-action`** — unified composition report

Part of the [Kinetic Gain Suite](https://suite.kineticgain.com/).

---

## Usage

```yaml
name: Suite fleet overview
on:
  pull_request:
    paths: ["governance-docs/**"]

jobs:
  overview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mizcausevic-dev/kg-suite-fleet-overview-action@v0.1-shipped
        with:
          dir: governance-docs/
          fail-on-missing-protocol: true   # optional
```

## Inputs

| input                       | required | default       | description |
|---|---|---|---|
| `dir`                       | ✓        | —             | Directory containing `*.json` Suite documents (mixed protocols supported). |
| `comment-on-pr`             |          | `auto`        | `auto` posts only on `pull_request` events. |
| `fail-on-missing-protocol`  |          | `false`       | Fail when any of the 4 core protocols is missing from the fleet. |
| `fail-on-unrouted`          |          | `false`       | Fail when any file did not match a known Suite protocol. |
| `max-unrouted`              |          | —             | Max allowed unrouted documents before failing (overrides `fail-on-unrouted`). |
| `github-token`              |          | `${{ github.token }}` | Token used to post the PR comment. |

## Outputs

| output                | description |
|---|---|
| `total-files`         | Number of JSON files analyzed. |
| `protocols-detected`  | Number of distinct Suite protocols detected. |
| `missing-protocols`   | Number of core protocols missing from the fleet. |
| `unrouted-files`      | Number of files that did not match any known Suite protocol. |

## What the PR comment shows

- **Composition by protocol** — counts + version diversity per Suite spec
- **Missing core protocols** — callout when AgentCards / Tool Cards / Prompt Provenance / Evidence Bundles aren't represented
- **Per-protocol tables** — id, name, version for every doc in that bucket
- **Low-confidence routings** — docs detected by shape signals only
- **Unrouted documents** — JSON files that didn't match any spec

## Composes with

- [**`kg-suite-fleet-overview`**](https://github.com/mizcausevic-dev/kg-suite-fleet-overview) — the library this wraps.
- [**`kg-protocol-detect`**](https://github.com/mizcausevic-dev/kg-protocol-detect) — the routing primitive used internally.
- The 4 cross-protocol gates: [`kg-suite-spec-version-tracker-action`](https://github.com/mizcausevic-dev/kg-suite-spec-version-tracker-action) · [`kg-suite-conformance-runner-action`](https://github.com/mizcausevic-dev/kg-suite-conformance-runner-action) · [`kg-suite-canonicalize-action`](https://github.com/mizcausevic-dev/kg-suite-canonicalize-action) · **this**.
- The 4 per-protocol fleet-summary actions — drill-down on content-level findings.

## License

[AGPL-3.0-or-later](LICENSE)
