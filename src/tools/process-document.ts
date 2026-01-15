import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface ProcessDocumentParams {
  url: string;
}

export interface ProcessDocumentResult {
  doc_name: string;
  status: "processing";
  submitted_at: string;
  estimated_completion: string;
  document_info: {
    pages: number;
    size_bytes: number;
  };
  next_steps: NextSteps;
}

export async function processDocument(
  transport: McpTransport,
  params: ProcessDocumentParams,
): Promise<ProcessDocumentResult> {
  return transport.callTool<ProcessDocumentResult>("process_document", {
    url: params.url,
  });
}
