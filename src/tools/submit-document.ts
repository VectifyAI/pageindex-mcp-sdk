import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface SubmitDocumentParams {
  fileName: string;
}

export interface SubmitDocumentResult {
  doc_name: string;
  status: "processing";
  submitted_at: string;
  estimated_completion: string;
  document_info: {
    pages: number;
  };
  next_steps: NextSteps;
}

export async function submitDocument(
  transport: McpTransport,
  params: SubmitDocumentParams,
): Promise<SubmitDocumentResult> {
  return transport.callTool<SubmitDocumentResult>("submit_document", {
    file_name: params.fileName,
  });
}
