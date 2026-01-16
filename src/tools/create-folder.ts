import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface CreateFolderParams {
  name: string;
  description?: string;
  parentFolderId?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  description: string | null;
  parent_folder_id: string | null;
  created_at: string;
  file_count: number;
  children_count: number;
}

export interface CreateFolderResult {
  folder: FolderItem;
  next_steps: NextSteps;
}

export async function createFolder(
  transport: McpTransport,
  params: CreateFolderParams,
): Promise<CreateFolderResult> {
  return transport.callTool<CreateFolderResult>("create_folder", {
    name: params.name,
    description: params.description,
    parent_folder_id: params.parentFolderId,
  });
}
