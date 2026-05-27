import { detect } from "./detect.js";
import {
  CORE_PROTOCOLS,
  type DocSummary,
  type FleetOverview,
  type OverviewOptions,
  type ProtocolBucket,
  type ProtocolId
} from "./types.js";

const UNVERSIONED = "__unversioned__";

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Extract a domain-specific id from each protocol's doc shape. */
function extractId(protocol: ProtocolId, doc: unknown): string | undefined {
  if (doc === null || typeof doc !== "object") return undefined;
  const obj = doc as Record<string, unknown>;
  switch (protocol) {
    case "agent-cards-spec": {
      const a = obj.agent as Record<string, unknown> | undefined;
      const id = a && asString(a.id);
      const ver = a && asString(a.version);
      return id && ver ? `${id}@${ver}` : id;
    }
    case "mcp-tool-card-spec": {
      const t = obj.tool as Record<string, unknown> | undefined;
      const server = t && asString(t.server_id);
      const name = t && asString(t.name);
      const ver = t && asString(t.version);
      if (server && name && ver) return `${server}:${name}@${ver}`;
      return name;
    }
    case "prompt-provenance-spec": {
      const p = obj.prompt as Record<string, unknown> | undefined;
      const id = p && asString(p.id);
      const ver = p && asString(p.version);
      return id && ver ? `${id}@${ver}` : id;
    }
    case "evidence-bundle-spec": {
      const b = obj.bundle as Record<string, unknown> | undefined;
      return b && asString(b.id);
    }
    default:
      return undefined;
  }
}

function extractName(protocol: ProtocolId, doc: unknown): string | undefined {
  if (doc === null || typeof doc !== "object") return undefined;
  const obj = doc as Record<string, unknown>;
  switch (protocol) {
    case "agent-cards-spec":
      return asString((obj.agent as Record<string, unknown> | undefined)?.name);
    case "mcp-tool-card-spec":
      return asString((obj.tool as Record<string, unknown> | undefined)?.description);
    case "prompt-provenance-spec":
      return asString((obj.prompt as Record<string, unknown> | undefined)?.name);
    case "evidence-bundle-spec":
      return asString((obj.bundle as Record<string, unknown> | undefined)?.subject);
    default:
      return undefined;
  }
}

/**
 * Build a unified fleet overview by routing every doc in `files` to its
 * protocol via kg-protocol-detect, then grouping + summarizing.
 */
export function overview(
  files: Array<{ path: string; doc: unknown }>,
  opts: OverviewOptions = {}
): FleetOverview {
  const generatedAt = opts.now ?? new Date().toISOString();

  const docsByProtocol = new Map<ProtocolId, DocSummary[]>();
  const unrouted: DocSummary[] = [];
  const lowConfidence: DocSummary[] = [];

  for (const f of files) {
    const detection = detect(f.doc);
    const summary: DocSummary = {
      file: f.path,
      protocol: detection.protocol,
      confidence: detection.confidence
    };
    if (detection.version !== undefined) summary.version = detection.version;
    const id = extractId(detection.protocol, f.doc);
    if (id !== undefined) summary.id = id;
    const name = extractName(detection.protocol, f.doc);
    if (name !== undefined) summary.name = name;

    if (detection.protocol === "unknown") {
      unrouted.push(summary);
      continue;
    }
    if (detection.confidence === "low") lowConfidence.push(summary);

    const bucket = docsByProtocol.get(detection.protocol) ?? [];
    bucket.push(summary);
    docsByProtocol.set(detection.protocol, bucket);
  }

  // Build sorted buckets.
  const buckets: ProtocolBucket[] = [];
  for (const [protocol, docs] of docsByProtocol) {
    docs.sort((a, b) => (a.id ?? a.file).localeCompare(b.id ?? b.file));
    const versions = new Set<string>();
    for (const d of docs) versions.add(d.version ?? UNVERSIONED);
    buckets.push({
      protocol,
      total: docs.length,
      versionsObserved: [...versions].sort(),
      docs
    });
  }
  buckets.sort((a, b) => a.protocol.localeCompare(b.protocol));

  const presentProtocols = new Set(buckets.map((b) => b.protocol));
  const missingProtocols = CORE_PROTOCOLS.filter((p) => !presentProtocols.has(p));

  return {
    generatedAt,
    files: files.length,
    buckets,
    missingProtocols,
    unrouted,
    lowConfidence
  };
}
