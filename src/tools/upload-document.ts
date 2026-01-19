import { PageIndexError } from "../errors.js";
import type { McpTransport } from "../transport.js";
import {
  type GetSignedUploadUrlResult,
  getSignedUploadUrl,
} from "./get-signed-upload-url.js";
import {
  type SubmitDocumentResult,
  submitDocument,
} from "./submit-document.js";
import type { NextSteps } from "./types.js";

export type UploadPhase = "get_signed_url" | "upload_file" | "submit_document";

export interface UploadDocumentParams {
  fileName: string;
  fileType: string;
  fileContent: Blob | Buffer | ArrayBuffer;
}

export interface UploadDocumentResult {
  serverFileName: string;
  originalName: string;
  sourceName: string;
  docName: string;
  status: "processing";
  submittedAt: string;
  estimatedCompletion: string;
  documentInfo: { pages: number };
  nextSteps: NextSteps;
}

function createUploadError(
  message: string,
  phase: UploadPhase,
  originalError?: unknown,
  serverFileName?: string,
): PageIndexError {
  return new PageIndexError(message, "INTERNAL_ERROR", {
    phase,
    ...(serverFileName && { serverFileName }),
    ...(originalError instanceof Error && {
      originalMessage: originalError.message,
    }),
  });
}

/**
 * Uploads a document in a single call by:
 * 1. Getting a signed upload URL
 * 2. Uploading the file content to the signed URL
 * 3. Submitting the document for processing
 *
 * @param transport - The MCP transport instance
 * @param params - Upload parameters including file name, type, and content
 * @returns The upload result with document processing information
 * @throws {PageIndexError} With `details.phase` indicating the failure stage
 */
export async function uploadDocument(
  transport: McpTransport,
  params: UploadDocumentParams,
): Promise<UploadDocumentResult> {
  const { fileName, fileType, fileContent } = params;

  let signedUrlResult: GetSignedUploadUrlResult;
  try {
    signedUrlResult = await getSignedUploadUrl(transport, {
      fileName,
      fileType,
    });
  } catch (error) {
    throw createUploadError(
      `Failed to get signed upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      "get_signed_url",
      error,
    );
  }

  const {
    upload_url,
    file_name: serverFileName,
    original_name,
    source_name,
  } = signedUrlResult;

  try {
    await uploadToSignedUrl(upload_url, fileContent, fileType);
  } catch (error) {
    throw createUploadError(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
      "upload_file",
      error,
      serverFileName,
    );
  }

  let submitResult: SubmitDocumentResult;
  try {
    submitResult = await submitDocument(transport, {
      fileName: serverFileName,
    });
  } catch (error) {
    throw createUploadError(
      `Failed to submit document: ${error instanceof Error ? error.message : "Unknown error"}`,
      "submit_document",
      error,
      serverFileName,
    );
  }

  return {
    serverFileName,
    originalName: original_name,
    sourceName: source_name,
    docName: submitResult.doc_name,
    status: submitResult.status,
    submittedAt: submitResult.submitted_at,
    estimatedCompletion: submitResult.estimated_completion,
    documentInfo: submitResult.document_info,
    nextSteps: submitResult.next_steps,
  };
}

async function uploadToSignedUrl(
  uploadUrl: string,
  fileContent: Blob | Buffer | ArrayBuffer,
  contentType: string,
): Promise<void> {
  const body =
    fileContent instanceof ArrayBuffer
      ? new Uint8Array(fileContent)
      : fileContent;

  const contentLength = body instanceof Blob ? body.size : body.byteLength;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(contentLength),
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Upload failed with status ${response.status}: ${errorText}`,
    );
  }
}
