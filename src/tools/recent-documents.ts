import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface RecentDocumentItem {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  pageNum?: number;
}

export interface RecentDocumentsResult {
  docs: RecentDocumentItem[];
  total_shown: number;
  processing_count: number;
  ready_count: number;
  failed_count: number;
  next_steps: NextSteps;
}

export async function recentDocuments(
  transport: McpTransport,
): Promise<RecentDocumentsResult> {
  const raw = await transport.callTool("recent_documents", {});
  const text = raw.content.find((c) => c.type === "text")?.text;
  return JSON.parse(text!) as RecentDocumentsResult;
}
