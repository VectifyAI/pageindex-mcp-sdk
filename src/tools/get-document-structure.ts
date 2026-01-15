import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface GetDocumentStructureParams {
  docName: string;
  part?: number;
  waitForCompletion?: boolean;
}

export interface GetDocumentStructureResult {
  doc_name: string;
  structure: unknown;
  total_parts?: number;
  next_steps: NextSteps;
}

export async function getDocumentStructure(
  transport: McpTransport,
  params: GetDocumentStructureParams,
): Promise<GetDocumentStructureResult> {
  return transport.callTool<GetDocumentStructureResult>(
    "get_document_structure",
    {
      doc_name: params.docName,
      part: params.part,
      wait_for_completion: params.waitForCompletion,
    },
  );
}
