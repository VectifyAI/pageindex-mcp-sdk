import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";
import { PageIndexError } from "../errors.js";
import { getSignedUploadUrl } from "./get-signed-upload-url.js";
import { submitDocument } from "./submit-document.js";

// Browser XMLHttpRequest types (only used when available)
declare const XMLHttpRequest: {
  new(): XMLHttpRequestInstance;
  prototype: XMLHttpRequestInstance;
} | undefined;

interface XMLHttpRequestInstance {
  open(method: string, url: string, async?: boolean): void;
  setRequestHeader(header: string, value: string): void;
  send(body?: Blob | Uint8Array | null): void;
  readonly status: number;
  readonly responseText: string;
  upload: {
    onprogress: ((event: ProgressEvent) => void) | null;
  };
  onload: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  ontimeout: ((event: Event) => void) | null;
}

interface ProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

export type UploadPhase = "get_signed_url" | "upload_file" | "submit_document";

export interface UploadDocumentParams {
  fileName: string;
  fileType: string;
  fileContent: Blob | Buffer | ArrayBuffer;
  onProgress?: (progress: { loaded: number; total: number }) => void;
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

/**
 * Creates a PageIndexError with phase information for upload failures.
 */
function createUploadError(
  message: string,
  phase: UploadPhase,
  originalError?: unknown,
  serverFileName?: string,
): PageIndexError {
  const details: Record<string, unknown> = { phase };

  if (serverFileName) {
    details.serverFileName = serverFileName;
  }

  if (originalError instanceof PageIndexError) {
    details.originalCode = originalError.code;
    if (originalError.details) {
      details.originalDetails = originalError.details;
    }
  } else if (originalError instanceof Error) {
    details.originalMessage = originalError.message;
  }

  return new PageIndexError(message, "INTERNAL_ERROR", details);
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
  const { fileName, fileType, fileContent, onProgress } = params;

  // Step 1: Get signed upload URL
  let signedUrlResult;
  try {
    signedUrlResult = await getSignedUploadUrl(transport, { fileName, fileType });
  } catch (error) {
    throw createUploadError(
      `Failed to get signed upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      "get_signed_url",
      error,
    );
  }

  const { upload_url, file_name: serverFileName, original_name, source_name } = signedUrlResult;

  // Step 2: Upload file to signed URL
  try {
    await uploadToSignedUrl(upload_url, fileContent, fileType, onProgress);
  } catch (error) {
    throw createUploadError(
      `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
      "upload_file",
      error,
      serverFileName,
    );
  }

  // Step 3: Submit document for processing
  let submitResult;
  try {
    submitResult = await submitDocument(transport, { fileName: serverFileName });
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

/**
 * Uploads file content to a signed URL using fetch.
 * Supports progress tracking via XMLHttpRequest in browser environments.
 */
async function uploadToSignedUrl(
  uploadUrl: string,
  fileContent: Blob | Buffer | ArrayBuffer,
  contentType: string,
  onProgress?: (progress: { loaded: number; total: number }) => void,
): Promise<void> {
  // Convert content to appropriate format
  const body = fileContent instanceof ArrayBuffer
    ? new Uint8Array(fileContent)
    : fileContent;

  const contentLength = body instanceof Blob
    ? body.size
    : body.byteLength;

  // If progress callback is provided and XMLHttpRequest is available (browser),
  // use XHR for progress tracking
  if (onProgress && typeof XMLHttpRequest !== "undefined") {
    return uploadWithXhr(uploadUrl, body, contentType, contentLength, onProgress);
  }

  // Otherwise use fetch (no progress tracking in Node.js)
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
    throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
  }
}

/**
 * Uploads using XMLHttpRequest for progress tracking (browser only).
 * This function is only called when XMLHttpRequest is available.
 */
function uploadWithXhr(
  uploadUrl: string,
  body: Blob | Uint8Array,
  contentType: string,
  contentLength: number,
  onProgress: (progress: { loaded: number; total: number }) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // XMLHttpRequest is guaranteed to exist when this function is called
    const xhr = new (XMLHttpRequest as NonNullable<typeof XMLHttpRequest>)();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress({ loaded: event.loaded, total: event.total });
      } else {
        onProgress({ loaded: event.loaded, total: contentLength });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out"));
    };

    xhr.send(body);
  });
}
