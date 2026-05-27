import type { FleetOverview, ProtocolId } from "./types.js";

const PROTOCOL_LABEL: Record<ProtocolId, string> = {
  "agent-cards-spec": "🤖 A2A AgentCards",
  "mcp-tool-card-spec": "🛠️ MCP Tool Cards",
  "prompt-provenance-spec": "📝 Prompt provenance",
  "evidence-bundle-spec": "📦 Evidence bundles",
  "otel-genai-otlp": "📡 OTel GenAI OTLP",
  "mcp-tools-list": "🔌 MCP tools/list",
  unknown: "❓ Unknown"
};

function listVersions(vers: string[]): string {
  return vers.map((v) => (v === "__unversioned__" ? "_(shape-only)_" : `\`${v}\``)).join(", ");
}

export function toMarkdown(report: FleetOverview): string {
  const lines: string[] = [];
  lines.push(`# Kinetic Gain Suite — fleet overview`);
  lines.push(``);
  lines.push(`Generated: \`${report.generatedAt}\` · Files scanned: **${report.files}** · Protocols detected: **${report.buckets.length}**`);
  lines.push(``);
  if (report.missingProtocols.length > 0) {
    lines.push(`> ⚠ **Missing from this fleet:** ${report.missingProtocols.map((p) => `\`${p}\``).join(", ")}. The Suite is designed to compose; consider whether a complete operator-grade governance surface needs documents of these types too.`);
    lines.push(``);
  }
  lines.push(`## Composition by protocol`);
  lines.push(``);
  if (report.buckets.length === 0) {
    lines.push(`_No Suite-recognized documents found._`);
  } else {
    lines.push(`| protocol | count | versions in use |`);
    lines.push(`|---|---:|---|`);
    for (const b of report.buckets) {
      lines.push(`| ${PROTOCOL_LABEL[b.protocol]} | ${b.total} | ${listVersions(b.versionsObserved)} |`);
    }
  }

  for (const b of report.buckets) {
    lines.push(``);
    lines.push(`## ${PROTOCOL_LABEL[b.protocol]} (${b.total})`);
    lines.push(``);
    lines.push(`| id / file | name / subject | version |`);
    lines.push(`|---|---|---|`);
    for (const d of b.docs) {
      const idCell = d.id ? `\`${d.id}\`` : `\`${d.file}\``;
      const nameCell = d.name ?? "—";
      const verCell = d.version ?? "_(shape-only)_";
      lines.push(`| ${idCell} | ${nameCell} | ${verCell} |`);
    }
  }

  if (report.lowConfidence.length > 0) {
    lines.push(``);
    lines.push(`## Low-confidence routings (${report.lowConfidence.length})`);
    lines.push(``);
    lines.push(`These docs were classified by shape signals only — they have no \`*_version\` discriminator field.`);
    lines.push(``);
    lines.push(`| file | detected protocol |`);
    lines.push(`|---|---|`);
    for (const d of report.lowConfidence) {
      lines.push(`| \`${d.file}\` | ${PROTOCOL_LABEL[d.protocol]} |`);
    }
  }

  if (report.unrouted.length > 0) {
    lines.push(``);
    lines.push(`## Unrouted documents (${report.unrouted.length})`);
    lines.push(``);
    lines.push(`| file |`);
    lines.push(`|---|`);
    for (const d of report.unrouted) lines.push(`| \`${d.file}\` |`);
  }

  return lines.join("\n");
}

export function toSummary(report: FleetOverview): string {
  const parts = [
    `${report.files} file${report.files === 1 ? "" : "s"}`,
    `${report.buckets.length} protocol${report.buckets.length === 1 ? "" : "s"}`,
    `${report.missingProtocols.length} missing`,
    `${report.unrouted.length} unrouted`
  ];
  return parts.join(" · ");
}
