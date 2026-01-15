import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface GetSignedUploadUrlParams {
  fileName: string;
  fileType: string;
}

export interface GetSignedUploadUrlResult {
  upload_url: string;
  file_name: string;
  original_name: string;
  source_name: string;
  next_steps: NextSteps;
}

export async function getSignedUploadUrl(
  transport: McpTransport,
  params: GetSignedUploadUrlParams,
): Promise<GetSignedUploadUrlResult> {
  const raw = await transport.callTool("get_signed_upload_url", {
    fileName: params.fileName,
    fileType: params.fileType,
  });
  const text = raw.content.find((c) => c.type === "text")?.text;
  return JSON.parse(text!) as GetSignedUploadUrlResult;
}
