import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { run, type RunnerEnv } from "../src/runner.js";
import { overview } from "../src/overview.js";
import { toMarkdown, toSummary } from "../src/format.js";
import { detect } from "../src/detect.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${here}/../fixtures/mixed`;

function envWithInputs(inputs: Record<string, string>): RunnerEnv {
  return {
    inputs,
    readFile: (p) => readFileSync(p, "utf8"),
    readDir: (p) => readdirSync(p),
    isFile: (p) => statSync(p).isFile(),
    write: () => undefined
  };
}

describe("runner.run", () => {
  it("exits 0 by default — overview is informational not a gate", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
    expect(r.report.files).toBe(9);
    expect(r.commentPosted).toBe(false);
  });

  it("exits 1 when fail-on-missing-protocol set and fleet is missing a core protocol", async () => {
    // Single-protocol fleet — 3 of 4 cores missing.
    const env: RunnerEnv = {
      inputs: { dir: "FAKE", fail_on_missing_protocol: "true", comment_on_pr: "false" },
      readFile: () => '{"agent_card_version":"0.1","agent":{},"capabilities":{}}',
      readDir: () => ["a.json"],
      isFile: () => true,
      write: () => undefined
    };
    const r = await run(env);
    expect(r.exitCode).toBe(1);
    expect(r.report.missingProtocols.length).toBeGreaterThan(0);
  });

  it("exits 1 when fail-on-unrouted set and unrouted files exist", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, fail_on_unrouted: "true", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
    expect(r.report.unrouted.length).toBeGreaterThan(0);
  });

  it("exits 1 when max-unrouted set and exceeded", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, max_unrouted: "0", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(1);
  });

  it("exits 0 when max-unrouted set and not exceeded", async () => {
    const r = await run(envWithInputs({ dir: FIXTURES, max_unrouted: "5", comment_on_pr: "false" }));
    expect(r.exitCode).toBe(0);
  });

  it("rejects invalid max-unrouted", async () => {
    await expect(run(envWithInputs({ dir: FIXTURES, max_unrouted: "-1" }))).rejects.toThrow(/max-unrouted/);
  });

  it("rejects when dir input is missing", async () => {
    await expect(run({ inputs: {} })).rejects.toThrow(/dir/);
  });

  it("posts a PR comment in pull_request context", async () => {
    const calls: Array<{ body: string }> = [];
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs", fail_on_unrouted: "false" },
      GITHUB_EVENT_NAME: "pull_request",
      GITHUB_REPOSITORY: "mizcausevic-dev/test",
      GITHUB_EVENT_PATH: `${here}/event.json`,
      readFile: (p) => (p.endsWith("event.json") ? JSON.stringify({ number: 7 }) : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      postComment: async (args) => { calls.push({ body: args.body }); },
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(true);
    expect(calls[0].body).toContain("Kinetic Gain Suite — fleet overview");
  });

  it("skips PR comment when token missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no github-token provided");
  });

  it("skips PR comment when GITHUB_EVENT_PATH missing", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs" },
      GITHUB_REPOSITORY: "x/y",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no GITHUB_EVENT_PATH");
  });

  it("skips PR comment when event has no PR number", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "true", github_token: "ghs" },
      GITHUB_REPOSITORY: "x/y",
      GITHUB_EVENT_PATH: "/event.json",
      readFile: (p) => (p.endsWith("event.json") ? "{}" : readFileSync(p, "utf8")),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
    expect(r.reason).toBe("no PR number in event payload");
  });

  it("does not comment on non-PR events with comment_on_pr=auto", async () => {
    const env: RunnerEnv = {
      inputs: { dir: FIXTURES, comment_on_pr: "auto", github_token: "ghs" },
      GITHUB_EVENT_NAME: "push",
      readFile: (p) => readFileSync(p, "utf8"),
      readDir: (p) => readdirSync(p),
      isFile: (p) => statSync(p).isFile(),
      write: () => undefined
    };
    const r = await run(env);
    expect(r.commentPosted).toBe(false);
  });
});

describe("vendored library unit coverage", () => {
  const files = readdirSync(FIXTURES).filter((e) => e.endsWith(".json")).map((e) => ({
    path: e,
    doc: JSON.parse(readFileSync(`${FIXTURES}/${e}`, "utf8"))
  }));

  it("detect routes versioned docs", () => {
    expect(detect({ agent_card_version: "0.1" }).protocol).toBe("agent-cards-spec");
    expect(detect(null).protocol).toBe("unknown");
  });

  it("overview groups + extracts ids", () => {
    const r = overview(files, { now: "2026-05-27T00:00:00Z" });
    expect(r.files).toBe(9);
    expect(r.buckets.length).toBeGreaterThan(0);
  });

  it("toMarkdown + toSummary render", () => {
    const r = overview(files, { now: "2026-05-27T00:00:00Z" });
    expect(toMarkdown(r)).toContain("fleet overview");
    expect(toSummary(r)).toContain("files");
  });
});
