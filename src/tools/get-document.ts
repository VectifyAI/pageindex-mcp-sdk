import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface GetDocumentParams {
  docName: string;
  waitForCompletion?: boolean;
}

export interface GetDocumentResult {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  pageNum?: number;
  wait_info?: {
    waited: boolean;
    elapsed_seconds?: number;
    final_status?: string;
  };
  next_steps: NextSteps;
}

export async function getDocument(
  transport: McpTransport,
  params: GetDocumentParams,
): Promise<GetDocumentResult> {
  const raw = await transport.callTool("get_document", {
    doc_name: params.docName,
    wait_for_completion: params.waitForCompletion,
  });
  const text = raw.content.find((c) => c.type === "text")?.text;
  return JSON.parse(text!) as GetDocumentResult;
}
