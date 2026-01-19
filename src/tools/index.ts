import type { McpTransport } from "../transport.js";
import {
  createFolder,
  type CreateFolderParams,
  type CreateFolderResult,
} from "./create-folder.js";
import {
  findRelevantDocuments,
  type FindRelevantDocumentsParams,
  type FindRelevantDocumentsResult,
} from "./find-relevant-documents.js";
import {
  listFolders,
  type ListFoldersParams,
  type ListFoldersResult,
} from "./list-folders.js";
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
  uploadDocument,
  type UploadDocumentParams,
  type UploadDocumentResult,
  type UploadPhase,
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
