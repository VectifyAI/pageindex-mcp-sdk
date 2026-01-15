import type { McpTransport } from "../transport.js";
import {
  findRelevantDocuments,
  type FindRelevantDocumentsParams,
  type FindRelevantDocumentsResult,
} from "./find-relevant-documents.js";
import {
  getDocument,
  type GetDocumentParams,
  type GetDocumentResult,
} from "./get-document.js";
import {
  getDocumentStructure,
  type GetDocumentStructureParams,
  type GetDocumentStructureResult,
} from "./get-document-structure.js";
import {
  getPageContent,
  type GetPageContentParams,
  type GetPageContentResult,
} from "./get-page-content.js";
import {
  getSignedUploadUrl,
  type GetSignedUploadUrlParams,
  type GetSignedUploadUrlResult,
} from "./get-signed-upload-url.js";
import {
  processDocument,
  type ProcessDocumentParams,
  type ProcessDocumentResult,
} from "./process-document.js";
import {
  recentDocuments,
  type RecentDocumentsResult,
} from "./recent-documents.js";
import {
  removeDocument,
  type RemoveDocumentParams,
  type RemoveDocumentResult,
} from "./remove-document.js";
import {
  submitDocument,
  type SubmitDocumentParams,
  type SubmitDocumentResult,
} from "./submit-document.js";

export type { NextSteps } from "./types.js";
export type {
  ProcessDocumentParams,
  ProcessDocumentResult,
} from "./process-document.js";
export type {
  RecentDocumentItem,
  RecentDocumentsResult,
} from "./recent-documents.js";
export type {
  FindRelevantDocumentsParams,
  FindRelevantDocumentsResult,
  SearchDocumentItem,
} from "./find-relevant-documents.js";
export type { GetDocumentParams, GetDocumentResult } from "./get-document.js";
export type {
  GetDocumentStructureParams,
  GetDocumentStructureResult,
} from "./get-document-structure.js";
export type {
  GetPageContentParams,
  GetPageContentResult,
  PageContentItem,
} from "./get-page-content.js";
export type {
  RemoveDocumentParams,
  RemoveDocumentResult,
} from "./remove-document.js";
export type {
  GetSignedUploadUrlParams,
  GetSignedUploadUrlResult,
} from "./get-signed-upload-url.js";
export type {
  SubmitDocumentParams,
  SubmitDocumentResult,
} from "./submit-document.js";

export class PageIndexTools {
  constructor(private transport: McpTransport) { }

  processDocument = (
    params: ProcessDocumentParams,
  ): Promise<ProcessDocumentResult> => processDocument(this.transport, params);

  recentDocuments = (): Promise<RecentDocumentsResult> =>
    recentDocuments(this.transport);

  findRelevantDocuments = (
    params?: FindRelevantDocumentsParams,
  ): Promise<FindRelevantDocumentsResult> =>
    findRelevantDocuments(this.transport, params);

  getDocument = (params: GetDocumentParams): Promise<GetDocumentResult> =>
    getDocument(this.transport, params);

  getDocumentStructure = (
    params: GetDocumentStructureParams,
  ): Promise<GetDocumentStructureResult> =>
    getDocumentStructure(this.transport, params);

  getPageContent = (
    params: GetPageContentParams,
  ): Promise<GetPageContentResult> => getPageContent(this.transport, params);

  removeDocument = (
    params: RemoveDocumentParams,
  ): Promise<RemoveDocumentResult> => removeDocument(this.transport, params);

  getSignedUploadUrl = (
    params: GetSignedUploadUrlParams,
  ): Promise<GetSignedUploadUrlResult> =>
    getSignedUploadUrl(this.transport, params);

  submitDocument = (
    params: SubmitDocumentParams,
  ): Promise<SubmitDocumentResult> => submitDocument(this.transport, params);
}
