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
  const raw = await transport.callTool("remove_document", {
    doc_names: params.docNames,
  });
  const text = raw.content.find((c) => c.type === "text")?.text;
  return JSON.parse(text!) as RemoveDocumentResult;
}
