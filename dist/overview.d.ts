import { type FleetOverview, type OverviewOptions } from "./types.js";
/**
 * Build a unified fleet overview by routing every doc in `files` to its
 * protocol via kg-protocol-detect, then grouping + summarizing.
 */
export declare function overview(files: Array<{
    path: string;
    doc: unknown;
}>, opts?: OverviewOptions): FleetOverview;
