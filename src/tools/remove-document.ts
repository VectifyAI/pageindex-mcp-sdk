import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface RemoveDocumentParams {
  docNames: string[];
}

export interface RemoveDocumentResult {
  results: {
    successful: number;
    failed: number;
    details: Array<{
      doc_name: string;
      success: boolean;
      error?: string;
    }>;
  };
  next_steps: NextSteps;
}

export async function removeDocument(
  transport: McpTransport,
  params: RemoveDocumentParams,
): Promise<RemoveDocumentResult> {
  return transport.callTool<RemoveDocumentResult>("remove_document", {
    doc_names: params.docNames,
  });
}
