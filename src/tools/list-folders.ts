import type { McpTransport } from "../transport.js";
import type { FolderItem } from "./create-folder.js";
import type { NextSteps } from "./types.js";

export interface ListFoldersParams {
  /**
   * Use "root" for root-level folders only, a folder ID for subfolders, or omit for all folders
   */
  parentFolderId?: string;
}

export interface ListFoldersResult {
  folders: FolderItem[];
  next_steps: NextSteps;
}

export async function listFolders(
  transport: McpTransport,
  params?: ListFoldersParams,
): Promise<ListFoldersResult> {
  return transport.callTool<ListFoldersResult>("list_folders", {
    parent_folder_id: params?.parentFolderId,
  });
}
