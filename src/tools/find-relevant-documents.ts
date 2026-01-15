import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface FindRelevantDocumentsParams {
  nameOrDescriptionFilter?: string;
  folderId?: string | null;
  cursor?: string;
  limit?: number;
}

export interface SearchDocumentItem {
  id: string;
  name: string;
  description: string;
  status: string;
  pageNum: number;
  createdAt: string;
  folderId: string | null;
}

export interface FindRelevantDocumentsResult {
  docs: SearchDocumentItem[];
  cursor?: string;
  has_more: boolean;
  next_steps: NextSteps;
}

export async function findRelevantDocuments(
  transport: McpTransport,
  params?: FindRelevantDocumentsParams,
): Promise<FindRelevantDocumentsResult> {
  const raw = await transport.callTool("find_relevant_documents", {
    name_or_description_filter: params?.nameOrDescriptionFilter,
    folder_id: params?.folderId,
    cursor: params?.cursor,
    limit: params?.limit,
  });
  const text = raw.content.find((c) => c.type === "text")?.text;
  return JSON.parse(text!) as FindRelevantDocumentsResult;
}
