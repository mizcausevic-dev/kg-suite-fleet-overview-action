// Compose a single unified overview of a mixed-protocol Kinetic Gain Suite directory.
// Routes each doc via the vendored kg-protocol-detect logic, groups by (protocol,
// spec_version), and emits a one-page Suite-state report ready for human review,
// docs publishing, or PR-comment use.
/** Protocols we consider "expected" in a complete Suite fleet (excludes mcp-tools-list + otel-genai-otlp + unknown). */
export const CORE_PROTOCOLS = [
    "agent-cards-spec",
    "mcp-tool-card-spec",
    "prompt-provenance-spec",
    "evidence-bundle-spec"
];
