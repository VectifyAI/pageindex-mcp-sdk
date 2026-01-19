import type { McpTransport } from "../transport.js";
import {
  type CreateFolderParams,
  type CreateFolderResult,
  createFolder,
} from "./create-folder.js";
import {
  type FindRelevantDocumentsParams,
  type FindRelevantDocumentsResult,
  findRelevantDocuments,
} from "./find-relevant-documents.js";
import {
  type GetDocumentStructureParams,
  type GetDocumentStructureResult,
  getDocumentStructure,
} from "./get-document-structure.js";
import {
  type GetDocumentParams,
  type GetDocumentResult,
  getDocument,
} from "./get-document.js";
import {
  type GetPageContentParams,
  type GetPageContentResult,
  getPageContent,
} from "./get-page-content.js";
import {
  type ListFoldersParams,
  type ListFoldersResult,
  listFolders,
} from "./list-folders.js";
import {
  type ProcessDocumentParams,
  type ProcessDocumentResult,
  processDocument,
} from "./process-document.js";
import {
  type RecentDocumentsResult,
  recentDocuments,
} from "./recent-documents.js";
import {
  type RemoveDocumentParams,
  type RemoveDocumentResult,
  removeDocument,
} from "./remove-document.js";
import {
  type UploadDocumentParams,
  type UploadDocumentResult,
  type UploadPhase,
  uploadDocument,
} from "./upload-document.js";

export type { NextSteps } from "./types.js";
export type {
  CreateFolderParams,
  CreateFolderResult,
  FolderItem,
} from "./create-folder.js";
export type { ListFoldersParams, ListFoldersResult } from "./list-folders.js";
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
  UploadDocumentParams,
  UploadDocumentResult,
  UploadPhase,
} from "./upload-document.js";

export class PageIndexTools {
  constructor(private transport: McpTransport) {}

  processDocument = (
    params: ProcessDocumentParams,
  ): Promise<ProcessDocumentResult> => processDocument(this.transport, params);

  recentDocuments = (): Promise<RecentDocumentsResult> =>
    recentDocuments(this.transport);

  findRelevantDocuments = (
    params?: FindRelevantDocumentsParams,
  ): Promise<FindRelevantDocumentsResult> =>
    findRelevantDocuments(this.transport, params);

  createFolder = (params: CreateFolderParams): Promise<CreateFolderResult> =>
    createFolder(this.transport, params);

  listFolders = (params?: ListFoldersParams): Promise<ListFoldersResult> =>
    listFolders(this.transport, params);

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

  uploadDocument = (
    params: UploadDocumentParams,
  ): Promise<UploadDocumentResult> => uploadDocument(this.transport, params);
}
