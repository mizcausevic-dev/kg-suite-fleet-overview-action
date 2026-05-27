export type ProtocolId = "agent-cards-spec" | "mcp-tool-card-spec" | "prompt-provenance-spec" | "evidence-bundle-spec" | "otel-genai-otlp" | "mcp-tools-list" | "unknown";
export type Confidence = "high" | "medium" | "low";
export interface DetectResult {
    protocol: ProtocolId;
    version?: string;
    confidence: Confidence;
    reason: string;
}
export interface DocSummary {
    /** Relative file path. */
    file: string;
    protocol: ProtocolId;
    version?: string;
    confidence: Confidence;
    /** Domain-aware short identifier extracted from the doc when available. */
    id?: string;
    /** Human-readable name extracted from the doc when available. */
    name?: string;
}
export interface ProtocolBucket {
    protocol: ProtocolId;
    total: number;
    /** Versions observed in this protocol bucket (string `__unversioned__` for shape-detected docs). */
    versionsObserved: string[];
    /** All docs routed to this bucket, sorted by id. */
    docs: DocSummary[];
}
export interface FleetOverview {
    generatedAt: string;
    files: number;
    /** Sorted by protocol id. */
    buckets: ProtocolBucket[];
    /** Detected protocols not represented in this fleet — useful for "what's missing" callouts. */
    missingProtocols: ProtocolId[];
    /** Files that didn't route to any known protocol. */
    unrouted: DocSummary[];
    /** Files that produced a low-confidence routing verdict. */
    lowConfidence: DocSummary[];
}
export interface OverviewOptions {
    now?: string;
}
/** Protocols we consider "expected" in a complete Suite fleet (excludes mcp-tools-list + otel-genai-otlp + unknown). */
export declare const CORE_PROTOCOLS: readonly ProtocolId[];
