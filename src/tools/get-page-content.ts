import type { McpTransport } from "../transport.js";
import type { NextSteps } from "./types.js";

export interface GetPageContentParams {
  docName: string;
  pages: string;
  waitForCompletion?: boolean;
}

export interface PageContentItem {
  page: number;
  text: string;
  block_id?: string;
  image_count?: number;
  image_annotations?: string[];
}

export interface GetPageContentResult {
  doc_name: string;
  total_pages: number;
  requested_pages: string;
  returned_pages: string;
  content: PageContentItem[];
  next_steps: NextSteps;
}

export async function getPageContent(
  transport: McpTransport,
  params: GetPageContentParams,
): Promise<GetPageContentResult> {
  return transport.callTool<GetPageContentResult>("get_page_content", {
    doc_name: params.docName,
    pages: params.pages,
    wait_for_completion: params.waitForCompletion,
  });
}
